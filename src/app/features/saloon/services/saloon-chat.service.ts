import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

export type SaloonMessageDTO = {
  id: number;
  saloonId: number;
  senderId: number;
  senderName: string;
  senderImg: string;
  content: string;
  createdAt: string;
};

export type SaloonPresenceDTO = {
  saloonId: number;
  connectedCount: number;
  chatEnabled: boolean;
};

export type SaloonChatHistoryDTO = {
  messages: SaloonMessageDTO[];
  joinedAt: string;
  sessionEndsAt: string;
  chatEnabled: boolean;
  connectedCount: number;
};

// Seuil minimum de participants pour activer le chat (affiché à l'utilisateur)
export const CHAT_MIN_PARTICIPANTS = 3;

@Injectable({
  providedIn: 'root',
})
export class SaloonChatService {
  private _http = inject(HttpClient);
  private _apiUrl = `${environment.apiUrl}/saloon-chat`;
  private _wsUrl = environment.apiUrl.replace('/api', '');

  private _stompClient: Client | null = null;
  private _messageSubject = new Subject<SaloonMessageDTO>();
  private _presenceSubject = new BehaviorSubject<SaloonPresenceDTO | null>(null);
  private _currentSaloonId: number | null = null;
  private _joinedAt: string | null = null;
  private _sessionEndsAt: string | null = null;

  // Observable pour recevoir les messages en temps réel
  messages$ = this._messageSubject.asObservable();
  // Observable pour la présence (nombre de connectés)
  presence$ = this._presenceSubject.asObservable();

  get joinedAt(): string | null {
    return this._joinedAt;
  }

  get sessionEndsAt(): string | null {
    return this._sessionEndsAt;
  }

  get isChatEnabled(): boolean {
    const presence = this._presenceSubject.value;
    return presence?.chatEnabled ?? false;
  }

  get connectedCount(): number {
    return this._presenceSubject.value?.connectedCount ?? 0;
  }

  /**
   * Récupère l'historique du chat avec les messages depuis le joinedAt de l'utilisateur
   * C'est la méthode principale à utiliser pour charger le chat
   */
  getChatHistory(saloonId: number, limit = 50): Observable<SaloonChatHistoryDTO> {
    return this._http.get<SaloonChatHistoryDTO>(`${this._apiUrl}/${saloonId}/history?limit=${limit}`);
  }

  /**
   * @deprecated Utiliser getChatHistory à la place
   */
  getMessages(saloonId: number, limit = 50): Observable<SaloonMessageDTO[]> {
    return this._http.get<SaloonMessageDTO[]>(`${this._apiUrl}/${saloonId}/messages?limit=${limit}`);
  }

  getPresence(saloonId: number): Observable<SaloonPresenceDTO> {
    return this._http.get<SaloonPresenceDTO>(`${this._apiUrl}/${saloonId}/presence`);
  }

  sendMessage(saloonId: number, content: string): Observable<SaloonMessageDTO> {
    return this._http.post<SaloonMessageDTO>(`${this._apiUrl}/${saloonId}/messages`, { content });
  }

  /**
   * Met à jour le joinedAt depuis les données du backend
   */
  setJoinedAt(joinedAt: string, sessionEndsAt: string): void {
    this._joinedAt = joinedAt;
    this._sessionEndsAt = sessionEndsAt;
  }

  connectToSaloonChat(saloonId: number): void {
    if (this._stompClient?.connected && this._currentSaloonId === saloonId) {
      return; // Déjà connecté à ce saloon
    }

    this.disconnect(); // Déconnecte si connecté à un autre saloon

    this._currentSaloonId = saloonId;

    this._stompClient = new Client({
      webSocketFactory: (): WebSocket => new SockJS(`${this._wsUrl}/ws`),
      connectHeaders: {
        saloonId: String(saloonId),
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    this._stompClient.onConnect = (): void => {
      console.log('Connected to saloon chat WebSocket');

      // S'abonner à la présence EN PREMIER (déclenche l'incrémentation du compteur backend)
      this._stompClient?.subscribe(`/topic/saloon-presence/${saloonId}`, message => {
        const presence: SaloonPresenceDTO = JSON.parse(message.body);
        this._presenceSubject.next(presence);
      });

      // S'abonner aux messages du chat
      this._stompClient?.subscribe(`/topic/saloon-chat/${saloonId}`, message => {
        const chatMessage: SaloonMessageDTO = JSON.parse(message.body);
        // Ne garder que les messages reçus après joinedAt (session-only)
        if (this._joinedAt && new Date(chatMessage.createdAt) >= new Date(this._joinedAt)) {
          this._messageSubject.next(chatMessage);
        }
      });

      // Récupérer la présence après un court délai pour avoir la valeur mise à jour
      setTimeout(() => {
        this.getPresence(saloonId).subscribe({
          next: (presence): void => {
            this._presenceSubject.next(presence);
          },
        });
      }, 500);
    };

    this._stompClient.onStompError = (frame): void => {
      console.error('WebSocket error:', frame);
    };

    this._stompClient.activate();
  }

  disconnect(): void {
    if (this._stompClient?.connected) {
      this._stompClient.deactivate();
    }
    this._stompClient = null;
    this._currentSaloonId = null;
    this._joinedAt = null;
    this._sessionEndsAt = null;
    this._presenceSubject.next(null);
  }
}
