import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { environment } from 'src/environments/environment';

export type SaloonPresenceUpdate = {
  saloonId: number;
  connectedCount: number;
};

/**
 * Service pour recevoir les mises à jour de présence de TOUS les saloons en temps réel.
 * Utilisé par la liste des saloons pour mettre à jour les compteurs instantanément.
 */
@Injectable({
  providedIn: 'root',
})
export class SaloonPresenceRealtimeService {
  private _stompClient: Client | null = null;
  private _wsUrl = environment.apiUrl.replace('/api', '');
  private _isConnected = false;

  // Map saloonId -> connectedCount
  private _presenceCounts = new BehaviorSubject<Map<number, number>>(new Map());
  presenceCounts$ = this._presenceCounts.asObservable();

  /**
   * Connecte au WebSocket et s'abonne au topic global de présence
   */
  connect(): void {
    if (this._isConnected) {
      console.log('🔌 Déjà connecté au WebSocket présence globale');
      return;
    }

    // Note: Les compteurs initiaux viennent du backend via GET /saloon (connectedCount)
    // Le WebSocket sert uniquement pour les mises à jour en temps réel

    console.log('🔌 Tentative de connexion WebSocket présence globale à:', `${this._wsUrl}/ws`);

    this._stompClient = new Client({
      webSocketFactory: (): WebSocket => new SockJS(`${this._wsUrl}/ws`),
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      debug: (str): void => console.log('STOMP debug:', str),
    });

    this._stompClient.onConnect = (): void => {
      this._isConnected = true;
      console.log('🔌 Présence globale WebSocket connecté');

      // S'abonner au topic global de présence (tous les saloons)
      this._stompClient?.subscribe('/topic/saloon-presence-all', message => {
        console.log('📡 Reçu présence globale:', message.body);
        const update: SaloonPresenceUpdate = JSON.parse(message.body);
        this._updatePresence(update.saloonId, update.connectedCount);
      });
    };

    this._stompClient.onStompError = (frame): void => {
      console.error('❌ WebSocket présence globale erreur:', frame);
    };

    this._stompClient.onWebSocketClose = (): void => {
      this._isConnected = false;
      console.log('🔌 Présence globale WebSocket déconnecté');
    };

    this._stompClient.activate();
  }

  /**
   * Met à jour le compteur pour un saloon
   */
  private _updatePresence(saloonId: number, count: number): void {
    const current = this._presenceCounts.value;
    const updated = new Map(current);
    updated.set(saloonId, count);
    this._presenceCounts.next(updated);
  }

  /**
   * Récupère le compteur pour un saloon spécifique
   */
  getCount(saloonId: number): number {
    return this._presenceCounts.value.get(saloonId) ?? 0;
  }

  disconnect(): void {
    if (this._stompClient?.connected) {
      this._stompClient.deactivate();
    }
    this._stompClient = null;
    this._isConnected = false;
  }
}
