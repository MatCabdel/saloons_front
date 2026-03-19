import { Injectable, inject } from '@angular/core';
import { Client, IMessage } from '@stomp/stompjs';
import { Subject, Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { PresenceEvent, SessionAlert, PresenceService } from './presence.service';

/**
 * Service WebSocket pour la gestion de la présence en temps réel.
 */
@Injectable({
  providedIn: 'root',
})
export class PresenceWebSocketService {
  private _stompClient!: Client;
  private _presenceSubject = new Subject<PresenceEvent>();
  private _sessionAlertSubject = new Subject<SessionAlert>();
  private _currentSaloonId: number | null = null;
  private _isConnected = false;

  private _presenceService = inject(PresenceService);

  /**
   * Connecte au WebSocket et s'abonne aux topics de présence.
   */
  connect(saloonId: number): void {
    if (this._isConnected && this._currentSaloonId === saloonId) {
      return;
    }

    this.disconnect();
    this._currentSaloonId = saloonId;

    const wsUrl = this._getWebSocketUrl();
    const token = localStorage.getItem('saloon_auth_token');

    this._stompClient = new Client({
      webSocketFactory: (): WebSocket => new WebSocket(wsUrl),
      reconnectDelay: 5000,
      connectHeaders: token ? { Authorization: `Bearer ${token}` } : {},
    });

    this._stompClient.onConnect = (): void => {
      this._isConnected = true;

      // S'abonner aux événements de présence du saloon
      this._stompClient.subscribe(`/topic/saloon/${saloonId}/presence`, (message: IMessage) => {
        const event: PresenceEvent = JSON.parse(message.body);
        this._presenceSubject.next(event);
        this._presenceService.updatePresenceFromEvent(event);
      });

      // S'abonner aux alertes de session personnelles
      this._stompClient.subscribe('/user/queue/session', (message: IMessage) => {
        const alert: SessionAlert = JSON.parse(message.body);
        this._sessionAlertSubject.next(alert);
      });
    };

    this._stompClient.onStompError = (): void => {
      // Erreur WebSocket silencieuse
    };

    this._stompClient.onWebSocketClose = (): void => {
      this._isConnected = false;
    };

    this._stompClient.activate();
  }

  /**
   * Déconnecte du WebSocket.
   */
  disconnect(): void {
    if (this._stompClient && this._isConnected) {
      this._stompClient.deactivate();
      this._isConnected = false;
      this._currentSaloonId = null;
    }
  }

  /**
   * Observable des événements de présence.
   */
  getPresenceEvents(): Observable<PresenceEvent> {
    return this._presenceSubject.asObservable();
  }

  /**
   * Observable des alertes de session.
   */
  getSessionAlerts(): Observable<SessionAlert> {
    return this._sessionAlertSubject.asObservable();
  }

  /**
   * Vérifie si le WebSocket est connecté.
   */
  isConnected(): boolean {
    return this._isConnected;
  }

  /**
   * Construit l'URL WebSocket à partir de l'URL de l'API.
   */
  private _getWebSocketUrl(): string {
    const apiUrl = environment.apiUrl;

    if (apiUrl.startsWith('https://')) {
      return apiUrl.replace('https://', 'wss://') + '/websocket';
    }

    if (apiUrl.startsWith('http://')) {
      return apiUrl.replace('http://', 'ws://') + '/websocket';
    }

    return 'ws://localhost:8080/websocket';
  }
}
