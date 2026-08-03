import { Injectable } from '@angular/core';
import { Client, IMessage } from '@stomp/stompjs';
import { Observable, Subject } from 'rxjs';
import { Message } from 'src/app/features/conversation/models/Conversation';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class WebSocketService {
  private _stompClient!: Client;
  private _messageSubject = new Subject<Message>();
  private _connectedSubject = new Subject<number>();
  private _connectionGeneration = 0;

  connect(conversationId: number): void {
    this.disconnect();
    const generation = ++this._connectionGeneration;

    const wsUrl = this.getWebSocketUrl();
    const token = localStorage.getItem('saloon_auth_token');

    const client = new Client({
      webSocketFactory: (): any => new WebSocket(wsUrl),
      reconnectDelay: 5000,
      connectHeaders: token ? { Authorization: `Bearer ${token}` } : {},
    });

    client.onConnect = (): void => {
      // Une ancienne connexion peut finir après une navigation rapide. Elle ne
      // doit jamais s'abonner à la place du client courant.
      if (generation !== this._connectionGeneration || client !== this._stompClient) {
        void client.deactivate();
        return;
      }

      client.subscribe(`/queue/conversation.${conversationId}`, (message: IMessage) => {
        const parsed = JSON.parse(message.body);
        const normalized = this._normalizeMessage(parsed, conversationId);

        // Garde-fou: ignorer tout message d'une autre conversation.
        if (normalized.conversationId !== conversationId) {
          return;
        }

        this._messageSubject.next(normalized);
      });

      // L'abonnement est maintenant actif : le composant peut rattraper par
      // HTTP les messages arrivés pendant la connexion ou une reconnexion.
      this._connectedSubject.next(conversationId);
    };

    client.onStompError = (frame: any): void => {
      if (generation !== this._connectionGeneration || client !== this._stompClient) {
        return;
      }
      const msg: string = frame?.headers?.message ?? '';
      if (msg.includes('Access denied') || msg.includes('Authentication')) {
        this.disconnect();
        localStorage.removeItem('saloon_auth_token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    };

    this._stompClient = client;
    client.activate();
  }

  public getWebSocketUrl(): string {
    const apiUrl = environment.apiUrl;

    if (apiUrl.startsWith('https://')) {
      return apiUrl.replace('https://', 'wss://') + '/websocket';
    }

    if (apiUrl.startsWith('http://')) {
      return apiUrl.replace('http://', 'ws://') + '/websocket';
    }

    return 'ws://localhost:8080/websocket';
  }

  sendMessage(message: any): void {
    if (this._stompClient && this._stompClient.connected) {
      this._stompClient.publish({
        destination: '/app/chat.sendPrivateMessage',
        body: JSON.stringify(message),
      });
    }
  }

  getMessages(): Observable<Message> {
    return this._messageSubject.asObservable();
  }

  getConnectedConversations(): Observable<number> {
    return this._connectedSubject.asObservable();
  }

  disconnect(): void {
    this._connectionGeneration++;
    if (this._stompClient && this._stompClient.active) {
      void this._stompClient.deactivate();
    }
  }

  private _normalizeMessage(raw: any, fallbackConversationId: number): Message {
    return {
      id: Number(raw?.id ?? Date.now()),
      conversationId: Number(
        raw?.conversationId ?? raw?.conversation?.id ?? fallbackConversationId
      ),
      sender: Number(raw?.senderId ?? raw?.sender ?? 0),
      senderName: String(raw?.senderName ?? ''),
      content: String(raw?.content ?? ''),
      sentAt: String(raw?.sentAt ?? new Date().toISOString()),
    };
  }
}
