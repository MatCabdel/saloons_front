import { Injectable, inject } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { Badge } from '@capawesome/capacitor-badge';
import { BehaviorSubject } from 'rxjs';
import { ConversationService } from 'src/app/features/conversation/services/conversation.service';

/**
 * Service de gestion du badge iOS (pastille rouge sur l'icône de l'app)
 * et du compteur total de messages non lus.
 */
@Injectable({
  providedIn: 'root',
})
export class BadgeService {
  private readonly _conversationService = inject(ConversationService);

  /** Nombre total de messages non lus (toutes conversations confondues) */
  private readonly _totalUnreadCount$ = new BehaviorSubject<number>(0);
  public readonly totalUnreadCount$ = this._totalUnreadCount$.asObservable();

  /**
   * Récupère le total des messages non lus depuis le backend
   * et met à jour le badge iOS.
   */
  async refreshUnreadCount(): Promise<void> {
    try {
      const response = await this._conversationService.getUserConversations().toPromise();
      if (response?.payload) {
        const total = response.payload.reduce((sum, conv) => sum + (conv.unreadCount || 0), 0);
        this._totalUnreadCount$.next(total);
        await this.setBadge(total);
        console.log('🔢 Total unread count:', total);
      }
    } catch (error) {
      console.error('Failed to refresh unread count:', error);
    }
  }

  /**
   * Incrémente le compteur de messages non lus (ex: quand on reçoit une push).
   */
  async incrementUnread(count: number = 1): Promise<void> {
    const newTotal = this._totalUnreadCount$.getValue() + count;
    this._totalUnreadCount$.next(newTotal);
    await this.setBadge(newTotal);
  }

  /**
   * Décrémente le compteur de messages non lus (ex: quand on lit une conversation).
   */
  async decrementUnread(count: number): Promise<void> {
    const newTotal = Math.max(0, this._totalUnreadCount$.getValue() - count);
    this._totalUnreadCount$.next(newTotal);
    await this.setBadge(newTotal);
  }

  /**
   * Met à jour le badge iOS avec le nombre spécifié.
   * Sur Android, le badge est géré par le système.
   */
  async setBadge(count: number): Promise<void> {
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    try {
      if (count > 0) {
        await Badge.set({ count });
        console.log('📛 Badge set to:', count);
      } else {
        await Badge.clear();
        console.log('📛 Badge cleared');
      }
    } catch (error) {
      console.error('Failed to set badge:', error);
    }
  }

  /**
   * Efface le badge iOS.
   */
  async clearBadge(): Promise<void> {
    await this.setBadge(0);
  }

  /**
   * Vérifie si les permissions de badge sont accordées.
   */
  async checkPermissions(): Promise<boolean> {
    if (!Capacitor.isNativePlatform()) {
      return true;
    }

    try {
      const result = await Badge.checkPermissions();
      return result.display === 'granted';
    } catch {
      return false;
    }
  }

  /**
   * Demande les permissions de badge si nécessaire.
   */
  async requestPermissions(): Promise<boolean> {
    if (!Capacitor.isNativePlatform()) {
      return true;
    }

    try {
      const result = await Badge.requestPermissions();
      return result.display === 'granted';
    } catch {
      return false;
    }
  }
}
