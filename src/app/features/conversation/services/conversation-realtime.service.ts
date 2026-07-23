import { Injectable } from '@angular/core';
import { Client, IMessage } from '@stomp/stompjs';
import { Observable, Subject } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Message } from '../models/Conversation';

@Injectable({ providedIn: 'root' })
export class ConversationRealtimeService {
  private _client?: Client;
  private readonly _messages$ = new Subject<Message>();
  private readonly _connected$ = new Subject<void>();

  connect(userId: number): void {
    if (this._client?.active) {
      return;
    }

    const token = localStorage.getItem('saloon_auth_token');
    const client = new Client({
      webSocketFactory: (): WebSocket => new WebSocket(this._getWebSocketUrl()),
      reconnectDelay: 5000,
      connectHeaders: token ? { Authorization: `Bearer ${token}` } : {},
    });

    client.onConnect = (): void => {
      if (client !== this._client) return;

      client.subscribe(`/queue/user.${userId}.messages`, (frame: IMessage) => {
        const raw = JSON.parse(frame.body);
        this._messages$.next({
          id: Number(raw.id),
          conversationId: Number(raw.conversationId),
          sender: Number(raw.senderId),
          senderName: String(raw.senderName ?? ''),
          content: String(raw.content ?? ''),
          sentAt: String(raw.sentAt),
        });
      });
      // La souscription est active. Le composant recharge l'état serveur pour
      // rattraper les messages éventuellement reçus pendant la coupure.
      this._connected$.next();
    };

    client.onStompError = (frame): void => {
      console.error('Conversation realtime STOMP error:', frame.headers['message']);
    };
    client.onWebSocketError = (event): void => {
      console.error('Conversation realtime WebSocket error:', event);
    };

    this._client = client;
    client.activate();
  }

  messages(): Observable<Message> {
    return this._messages$.asObservable();
  }

  connected(): Observable<void> {
    return this._connected$.asObservable();
  }

  disconnect(): void {
    const client = this._client;
    this._client = undefined;
    if (client?.active) {
      void client.deactivate();
    }
  }

  private _getWebSocketUrl(): string {
    if (environment.apiUrl.startsWith('https://')) {
      return environment.apiUrl.replace('https://', 'wss://') + '/websocket';
    }
    if (environment.apiUrl.startsWith('http://')) {
      return environment.apiUrl.replace('http://', 'ws://') + '/websocket';
    }
    return 'ws://localhost:8080/websocket';
  }
}
