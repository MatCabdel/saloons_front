import { Component, HostListener, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { MessagerieComponent } from '../../components/messagerie/messagerie.component';
import { ActivatedRoute, Router } from '@angular/router';
import { VersionedImageUrlPipe } from 'src/app/common/pipes/versioned-image-url.pipe';
import { ConversationService } from 'src/app/features/conversation/services/conversation.service';
import { HeartRequestService } from 'src/app/features/conversation/services/heart-request.service';
import {
  ReportModalComponent,
  ReportModalData,
} from 'src/app/features/report/components/report-modal/report-modal.component';
import { User } from 'src/app/features/user/models/user';
import { UserService } from 'src/app/features/user/services/user.service';
import { UserStoreService } from 'src/app/features/user/store/user-store.service';
import {
  Conversation,
  HeartRequestStatus,
} from 'src/app/features/conversation/models/Conversation';
import { interval, Subscription } from 'rxjs';
import { PresenceService } from 'src/app/features/saloon/services/presence.service';
import { BadgeService } from 'src/app/core/services/badge.service';
import { HttpErrorResponse } from '@angular/common/http';
import { MatchService } from 'src/app/features/match/services/match.service';

@Component({
  selector: 'app-messages-page',
  standalone: true,
  imports: [MessagerieComponent, ReportModalComponent, VersionedImageUrlPipe],
  templateUrl: './messages-page.component.html',
  styleUrl: './messages-page.component.scss',
})
export class MessagesPageComponent implements OnInit, OnDestroy {
  private _router = inject(Router);
  private _route = inject(ActivatedRoute);
  private _conversationService = inject(ConversationService);
  private _heartRequestService = inject(HeartRequestService);
  private _userStore = inject(UserStoreService);
  private _userService = inject(UserService);
  private _presenceService = inject(PresenceService);
  private _badgeService = inject(BadgeService);
  private _matchService = inject(MatchService);

  userTarget?: User;
  conversationId: number | null = null;
  matchUserId: number | null = null; // Mode match sans conversation
  isMatchExpired = false; // Mode match expiré (session terminée, pas de conversation)
  otherParticipantLeft = false;
  isMatchCancelled = false;
  isHeartWindowExpired = false; // true si la fenêtre 12h pour coup de cœur est expirée
  conversation?: Conversation;

  // Heart Request state
  heartRequestStatus: HeartRequestStatus | null = null;
  heartRequestCountdown = signal<string>('');
  heartRequestSending = signal(false);
  private _countdownSubscription?: Subscription;
  private _leaveConfirmedSubscription?: Subscription;

  isMenuOpen = false;
  showDeleteMatchModal = false;
  showDeleteConvModal = false;

  // Modal de signalement
  showReportModal = signal(false);
  reportModalData = signal<ReportModalData | null>(null);

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.menu-container')) {
      this.isMenuOpen = false;
    }
  }

  ngOnInit(): void {
    const conversationIdParam = this._route.snapshot.paramMap.get('conversationId');
    const matchUserIdParam = this._route.snapshot.paramMap.get('matchUserId');
    const expiredParam = this._route.snapshot.queryParamMap.get('expired');

    if (conversationIdParam) {
      // Mode conversation existante
      this.conversationId = Number(conversationIdParam);
      this._loadConversation();
    } else if (matchUserIdParam) {
      // Mode match sans conversation
      this.matchUserId = Number(matchUserIdParam);
      this.isMatchExpired = expiredParam === 'true';
      this._loadMatchUser();
    }

    this._leaveConfirmedSubscription = this._presenceService.leaveConfirmed$.subscribe(() => {
      if (this.conversationId) {
        this._loadConversation();
      }
    });
  }

  @HostListener('window:focus')
  onWindowFocus(): void {
    if (this.conversationId) {
      this._loadConversation(false);
    }
  }

  private _loadConversation(markAsRead: boolean = true): void {
    if (!this.conversationId) return;

    this._conversationService.getConversation(this.conversationId).subscribe({
      next: (conv: Conversation) => {
        const myId = this._userStore.getUserId();
        this.userTarget = conv.participants.find((u: User) => u.id !== myId);
        this.otherParticipantLeft = conv.otherParticipantLeft || !!conv.expiredAt;
        this.isMatchCancelled = conv.isMatchCancelled || false;
        this.isHeartWindowExpired = conv.isHeartWindowExpired || false;
        this.conversation = conv;

        // Marquer la conversation comme lue uniquement au chargement principal
        if (markAsRead) {
          this._markConversationAsRead();
        }

        // Charger le statut des coups de cœur seulement si expiré mais pas annulé ET fenêtre pas expirée
        if (this.otherParticipantLeft && !this.isMatchCancelled && !this.isHeartWindowExpired) {
          this._loadHeartRequestStatus();
        }
      },
      error: err => {
        // Si 403, l'utilisateur a été supprimé de la conversation
        if (err.status === 403) {
          this._router.navigate(['/chat']);
        }
      },
    });
  }

  /**
   * Marque la conversation comme lue et met à jour le badge iOS.
   */
  private _markConversationAsRead(): void {
    if (!this.conversationId) return;

    // Mémoriser le nombre de non lus avant de marquer comme lu
    const unreadBefore = this.conversation?.unreadCount || 0;

    this._conversationService.markAsRead(this.conversationId).subscribe({
      next: () => {
        console.log('📖 Conversation marked as read:', this.conversationId);
        // Décrémenter le badge iOS du nombre qu'on vient de lire
        if (unreadBefore > 0) {
          this._badgeService.decrementUnread(unreadBefore);
        }
      },
      error: (err: HttpErrorResponse) => {
        console.error('Failed to mark conversation as read:', err);
      },
    });
  }

  private _loadMatchUser(): void {
    if (!this.matchUserId) return;

    this._userService.getUserById(this.matchUserId).subscribe({
      next: (user: User) => {
        this.userTarget = user;
      },
      error: () => {
        this._router.navigate(['/chat']);
      },
    });
  }

  // Appelé par messagerie quand une conversation est créée
  onConversationCreated(conversationId: number): void {
    this.conversationId = conversationId;
    this.matchUserId = null;
    // Ne pas changer l'URL pour éviter le rechargement
    // L'URL reste /messages/match/:userId mais en interne on a maintenant conversationId
  }

  ngOnDestroy(): void {
    this._countdownSubscription?.unsubscribe();
    this._leaveConfirmedSubscription?.unsubscribe();
  }

  goBack(): void {
    this._router.navigate(['/chat']);
  }

  private _loadHeartRequestStatus(): void {
    if (!this.conversationId) return;

    this._heartRequestService.getHeartRequestStatus(this.conversationId).subscribe({
      next: (status: HeartRequestStatus) => {
        this.heartRequestStatus = status;
        if (status.canSend && status.expiresAt) {
          this._startCountdown(status.expiresAt);
        } else if (status.sentByMe && status.expiresAt) {
          this._startCountdown(status.expiresAt);
        }
      },
      error: err => {
        console.error('Erreur lors du chargement du statut coup de cœur:', err);
      },
    });
  }

  private _startCountdown(expiresAt: string): void {
    this._countdownSubscription?.unsubscribe();

    const updateCountdown = (): void => {
      const now = new Date().getTime();
      const end = new Date(expiresAt).getTime();
      const diff = end - now;

      if (diff <= 0) {
        this.heartRequestCountdown.set('Expiré');
        this._countdownSubscription?.unsubscribe();
        if (this.heartRequestStatus) {
          this.heartRequestStatus = { ...this.heartRequestStatus, canSend: false };
        }
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      this.heartRequestCountdown.set(
        `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds
          .toString()
          .padStart(2, '0')}`
      );
    };

    updateCountdown();
    this._countdownSubscription = interval(1000).subscribe(() => updateCountdown());
  }

  sendHeartRequest(): void {
    if (
      !this.userTarget ||
      !this.heartRequestStatus?.canSend ||
      this.heartRequestSending() ||
      !this.conversationId
    ) {
      return;
    }

    this.heartRequestSending.set(true);
    const myId = this._userStore.getUserId();

    this._heartRequestService
      .sendHeartRequest({
        conversationId: this.conversationId,
        receiverId: this.userTarget.id,
        saloonId: null,
      })
      .subscribe({
        next: result => {
          this.heartRequestSending.set(false);

          // Si le coup de cœur est mutuel, rediriger vers la page de confirmation
          if (result.isMutual) {
            this._router.navigate(['/heart-confirmed', myId, this.userTarget!.id], {
              queryParams: { conversationId: this.conversationId },
            });
          } else {
            this._loadHeartRequestStatus();
          }
        },
        error: err => {
          console.error("Erreur lors de l'envoi du coup de cœur:", err);
          this.heartRequestSending.set(false);
        },
      });
  }

  goToUserProfil(): void {
    if (this.userTarget && !this.otherParticipantLeft) {
      this._router.navigate(['/profil-visitor', this.userTarget.id]);
    }
  }

  toggleMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;
  }

  confirmDeleteMatch(): void {
    this.isMenuOpen = false;
    this.showDeleteMatchModal = true;
  }

  confirmDeleteConversation(): void {
    this.isMenuOpen = false;
    this.showDeleteConvModal = true;
  }

  cancelDelete(): void {
    this.showDeleteMatchModal = false;
    this.showDeleteConvModal = false;
  }

  deleteMatch(): void {
    if (!this.conversationId && this.matchUserId) {
      // En mode match sans conversation, supprimer le match directement via l'API
      this._matchService.deleteMatch(this.matchUserId).subscribe({
        next: () => {
          this.showDeleteMatchModal = false;
          this._router.navigate(['/chat']);
        },
        error: (err: Error) => {
          console.error('Erreur lors de la suppression du match:', err);
          this.showDeleteMatchModal = false;
          this._router.navigate(['/chat']);
        },
      });
      return;
    }

    if (!this.conversationId) {
      this._router.navigate(['/chat']);
      return;
    }

    this._conversationService.deleteConversation(this.conversationId).subscribe({
      next: () => {
        this.showDeleteMatchModal = false;
        this._router.navigate(['/chat']);
      },
      error: (err: Error) => {
        console.error('Erreur lors de la suppression du match:', err);
        this.showDeleteMatchModal = false;
      },
    });
  }

  deleteConversation(): void {
    if (!this.conversationId) {
      this._router.navigate(['/chat']);
      return;
    }

    this._conversationService.deleteConversation(this.conversationId).subscribe({
      next: () => {
        this.showDeleteConvModal = false;
        this._router.navigate(['/chat']);
      },
      error: (err: Error) => {
        console.error('Erreur lors de la suppression de la conversation:', err);
        this.showDeleteConvModal = false;
      },
    });
  }

  reportUser(): void {
    this.isMenuOpen = false;
    if (this.userTarget) {
      this.reportModalData.set({
        reportedId: this.userTarget.id,
        reportedUserName: this.userTarget.userName,
      });
      this.showReportModal.set(true);
    }
  }

  closeReportModal(): void {
    this.showReportModal.set(false);
    this.reportModalData.set(null);
  }

  onReported(): void {
    this.closeReportModal();
  }
}
