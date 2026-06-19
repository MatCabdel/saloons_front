import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Capacitor } from '@capacitor/core';
import {
  FirebaseMessaging,
  GetTokenOptions,
  TokenReceivedEvent,
  NotificationReceivedEvent,
  NotificationActionPerformedEvent,
} from '@capacitor-firebase/messaging';
import { environment } from '../../../environments/environment';
import { BehaviorSubject, firstValueFrom } from 'rxjs';
import { BadgeService } from './badge.service';

/**
 * Service de gestion des notifications push via Firebase Cloud Messaging.
 * Gère : permission, token FCM, listeners, navigation, sync backend.
 */
@Injectable({
  providedIn: 'root',
})
export class PushNotificationService {
  private readonly _http = inject(HttpClient);
  private readonly _router = inject(Router);
  private readonly _badgeService = inject(BadgeService);
  private _listenersRegistered = false;

  /** Token FCM actuel (null si pas encore récupéré ou permission refusée) */
  private readonly _fcmToken$ = new BehaviorSubject<string | null>(null);
  public readonly fcmToken$ = this._fcmToken$.asObservable();

  /** Statut de la permission */
  private readonly _permissionStatus$ = new BehaviorSubject<'granted' | 'denied' | 'prompt'>(
    'prompt'
  );
  public readonly permissionStatus$ = this._permissionStatus$.asObservable();

  /**
   * Initialise le service push.
   * À appeler une fois l'utilisateur authentifié.
   */
  async initialize(): Promise<void> {
    // Push uniquement sur native (iOS/Android)
    if (!Capacitor.isNativePlatform()) {
      console.log('🔔 Push notifications: skipped (web platform)');
      return;
    }

    try {
      // Installer les listeners en premier pour capter un tap de notification au lancement.
      this._setupListeners();

      // 1. Vérifier/demander la permission
      const permissionGranted = await this._requestPermission();
      if (!permissionGranted) {
        console.warn('🔔 Push notifications: permission denied');
        return;
      }

      // 2. Récupérer le token FCM
      await this._getAndRegisterToken();

      // 3. S'abonner au topic "test" pour debug via Firebase Console
      await this._subscribeToTestTopic();

      // 4. Rafraîchir le compteur de messages non lus et le badge iOS
      await this._badgeService.refreshUnreadCount();

      console.log('🔔 Push notifications: initialized successfully');
    } catch (error) {
      console.error('🔔 Push notifications: initialization failed', error);
    }
  }

  /**
   * Demande la permission de notifications.
   * @returns true si accordée
   */
  private async _requestPermission(): Promise<boolean> {
    try {
      // Vérifier l'état actuel
      const currentStatus = await FirebaseMessaging.checkPermissions();
      console.log('🔔 Current permission status:', currentStatus.receive);

      if (currentStatus.receive === 'granted') {
        this._permissionStatus$.next('granted');
        return true;
      }

      if (currentStatus.receive === 'denied') {
        this._permissionStatus$.next('denied');
        return false;
      }

      // Demander la permission
      const result = await FirebaseMessaging.requestPermissions();
      const granted = result.receive === 'granted';
      this._permissionStatus$.next(granted ? 'granted' : 'denied');

      console.log('🔔 Permission request result:', result.receive);
      return granted;
    } catch (error) {
      console.error('🔔 Permission request failed:', error);
      return false;
    }
  }

  /**
   * Récupère le token FCM et l'enregistre sur le backend.
   */
  private async _getAndRegisterToken(): Promise<void> {
    try {
      const options: GetTokenOptions = {
        // vapidKey uniquement pour le web, pas nécessaire pour iOS natif
      };

      const result = await FirebaseMessaging.getToken(options);
      const token = result.token;

      if (!token) {
        console.warn('🔔 No FCM token received');
        return;
      }

      console.log('🔔 FCM Token received:', token.substring(0, 20) + '...');
      this._fcmToken$.next(token);

      // Enregistrer sur le backend
      await this._registerTokenOnBackend(token);
    } catch (error) {
      console.error('🔔 Failed to get FCM token:', error);
    }
  }

  /**
   * S'abonne au topic "test" pour tester via Firebase Console.
   * Ce topic permet d'envoyer des notifs de test sans cibler un token spécifique.
   */
  private async _subscribeToTestTopic(): Promise<void> {
    try {
      await FirebaseMessaging.subscribeToTopic({ topic: 'test' });
      console.log(
        '🔔 ✅ Subscribed to topic "test" - You can now send test notifications from Firebase Console'
      );
    } catch (error) {
      console.error('🔔 ❌ Failed to subscribe to topic "test":', error);
    }
  }

  /**
   * Envoie le token FCM au backend pour l'associer à l'utilisateur.
   */
  private async _registerTokenOnBackend(token: string): Promise<void> {
    try {
      await firstValueFrom(
        this._http.post(`${environment.apiUrl}/push-tokens`, {
          token,
          platform: Capacitor.getPlatform(), // 'ios' ou 'android'
        })
      );
      console.log('🔔 Token registered on backend');
    } catch (error) {
      console.error('🔔 Failed to register token on backend:', error);
    }
  }

  /**
   * Configure les listeners pour les notifications.
   */
  private _setupListeners(): void {
    if (this._listenersRegistered) {
      return;
    }

    this._listenersRegistered = true;
    console.log('🔔 Setting up push notification listeners...');

    // Listener : nouveau token (refresh)
    FirebaseMessaging.addListener('tokenReceived', async (event: TokenReceivedEvent) => {
      console.log('🔔 Token refreshed:', event.token.substring(0, 20) + '...');
      this._fcmToken$.next(event.token);
      await this._registerTokenOnBackend(event.token);
    });

    // Listener : notification reçue en foreground
    FirebaseMessaging.addListener('notificationReceived', (event: NotificationReceivedEvent) => {
      console.log('🔔 ================================');
      console.log('🔔 NOTIFICATION RECEIVED (FOREGROUND)');
      console.log('🔔 Title:', event.notification.title);
      console.log('🔔 Body:', event.notification.body);
      console.log('🔔 Data:', JSON.stringify(event.notification.data));
      console.log('🔔 Full notification:', JSON.stringify(event.notification));
      console.log('🔔 ================================');

      // Incrémenter le badge selon le type de notification
      const data = event.notification.data as Record<string, unknown> | undefined;
      if (data) {
        const type = data['type'] as string | undefined;
        if (
          type === 'private_message' ||
          type === 'mutual_heart' ||
          type === 'conversation_expired'
        ) {
          this._badgeService.incrementUnread(1);
        }
      }
    });

    // Listener : utilisateur tape sur la notification
    FirebaseMessaging.addListener(
      'notificationActionPerformed',
      (event: NotificationActionPerformedEvent) => {
        console.log('🔔 ================================');
        console.log('🔔 NOTIFICATION TAPPED');
        console.log('🔔 Title:', event.notification.title);
        console.log('🔔 Body:', event.notification.body);
        console.log('🔔 Data:', JSON.stringify(event.notification.data));
        console.log('🔔 ActionId:', event.actionId);
        console.log('🔔 ================================');

        // Récupérer les data de la notification
        const data = event.notification.data;
        if (data && Object.keys(data).length > 0) {
          this._handleNotificationNavigation(data as Record<string, unknown>);
        }
      }
    );

    console.log('🔔 ✅ All listeners set up successfully');
  }

  /**
   * Navigue vers la bonne page selon les data de la notification.
   */
  private _handleNotificationNavigation(data: Record<string, unknown>): void {
    const conversationId = this._readNotificationValue(data, [
      'conversationId',
      'conversation_id',
      'conversation',
    ]);
    const messageType = this._readNotificationValue(data, [
      'type',
      'notificationType',
      'notification_type',
    ]);

    switch (messageType) {
      case 'mutual_heart':
      case 'conversation_expired':
      case 'private_message':
        if (conversationId) {
          console.log('🔔 Navigating to conversation:', conversationId);
          this._router.navigate(['/messages', conversationId]);
        }
        break;

      case 'saloon_15min':
        // Pas de navigation spécifique, l'utilisateur est déjà dans le saloon
        console.log('🔔 15min alert received — no navigation needed');
        break;

      case 'saloon_chat': {
        const saloonId = this._readNotificationValue(data, ['saloonId', 'saloon_id']);
        if (saloonId) {
          this._router.navigate(['/saloon-chat', saloonId]);
        }
        break;
      }

      default:
        if (conversationId) {
          console.log('🔔 Navigating to conversation:', conversationId);
          this._router.navigate(['/messages', conversationId]);
        }
        break;
    }
  }

  private _readNotificationValue(
    data: Record<string, unknown>,
    keys: string[]
  ): string | undefined {
    for (const key of keys) {
      const value = data[key];
      if (value === null || value === undefined || value === '') {
        continue;
      }

      if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
        return String(value);
      }
    }

    return undefined;
  }

  /**
   * Supprime le token du backend (à appeler lors de la déconnexion).
   */
  async unregisterToken(): Promise<void> {
    const currentToken = this._fcmToken$.getValue();
    if (!currentToken) return;

    try {
      await firstValueFrom(
        this._http.delete(`${environment.apiUrl}/push-tokens/${encodeURIComponent(currentToken)}`)
      );
      console.log('🔔 Token unregistered from backend');
      this._fcmToken$.next(null);
    } catch (error) {
      console.error('🔔 Failed to unregister token:', error);
    }
  }

  /**
   * Récupère le nombre de badges (pour affichage).
   * Note: Le badge est géré automatiquement par iOS via le payload de la notif.
   */
  async getBadgeCount(): Promise<number> {
    // Sur iOS, le badge est géré par le système via le payload
    // Cette méthode est un placeholder si tu veux le lire côté app
    return 0;
  }

  /**
   * Réinitialise le badge à 0.
   * À appeler quand l'utilisateur ouvre l'app ou lit ses messages.
   */
  async clearBadge(): Promise<void> {
    if (!Capacitor.isNativePlatform()) return;
    try {
      await FirebaseMessaging.removeAllDeliveredNotifications();
      console.log('🔔 Badge cleared');
    } catch (error) {
      console.error('🔔 Failed to clear badge:', error);
    }
  }
}
