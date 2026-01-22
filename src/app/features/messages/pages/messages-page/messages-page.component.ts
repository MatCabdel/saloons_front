import { Component, HostListener, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { HeaderComponent } from '../../../../common/components/header/header.component';
import { MessagerieComponent } from '../../components/messagerie/messagerie.component';
import { ActivatedRoute, Router } from '@angular/router';
import { ConversationService } from 'src/app/features/conversation/services/conversation.service';
import { HeartRequestService } from 'src/app/features/conversation/services/heart-request.service';
import { ReportModalComponent, ReportModalData } from 'src/app/features/report/components/report-modal/report-modal.component';
import { User } from 'src/app/features/user/models/user';
import { UserStoreService } from 'src/app/features/user/store/user-store.service';
import { Conversation, HeartRequestStatus } from 'src/app/features/conversation/models/Conversation';
import { interval, Subscription } from 'rxjs';

@Component({
  selector: 'app-messages-page',
  standalone: true,
  imports: [HeaderComponent, MessagerieComponent, ReportModalComponent],
  templateUrl: './messages-page.component.html',
  styleUrl: './messages-page.component.scss',
})
export class MessagesPageComponent implements OnInit, OnDestroy {
  private _router = inject(Router);
  private _route = inject(ActivatedRoute);
  private _conversationService = inject(ConversationService);
  private _heartRequestService = inject(HeartRequestService);
  private _userStore = inject(UserStoreService);
  userTarget?: User;
  conversationId!: number;
  otherParticipantLeft = false;
  isMatchCancelled = false;
  conversation?: Conversation;

  // Heart Request state
  heartRequestStatus: HeartRequestStatus | null = null;
  heartRequestCountdown = signal<string>('');
  heartRequestSending = signal(false);
  private _countdownSubscription?: Subscription;

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
    this.conversationId = Number(this._route.snapshot.paramMap.get('conversationId'));
    this._conversationService.getConversation(this.conversationId).subscribe({
      next: (conv: Conversation) => {
        const myId = this._userStore.getUserId();
        this.userTarget = conv.participants.find((u: User) => u.id !== myId);
        this.otherParticipantLeft = conv.otherParticipantLeft || false;
        this.isMatchCancelled = conv.isMatchCancelled || false;
        this.conversation = conv;

        // Charger le statut des coups de cœur seulement si expiré mais pas annulé
        if (this.otherParticipantLeft && !this.isMatchCancelled) {
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

  ngOnDestroy(): void {
    this._countdownSubscription?.unsubscribe();
  }

  private _loadHeartRequestStatus(): void {
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

      this.heartRequestCountdown.set(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
    };

    updateCountdown();
    this._countdownSubscription = interval(1000).subscribe(() => updateCountdown());
  }

  sendHeartRequest(): void {
    if (!this.userTarget || !this.heartRequestStatus?.canSend || this.heartRequestSending()) {
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
        next: (result) => {
          this.heartRequestSending.set(false);
          
          // Si le coup de cœur est mutuel, rediriger vers la page de confirmation
          if (result.isMutual) {
            this._router.navigate(['/heart-confirmed', myId, this.userTarget!.id], {
              queryParams: { conversationId: this.conversationId }
            });
          } else {
            this._loadHeartRequestStatus();
          }
        },
        error: err => {
          console.error('Erreur lors de l\'envoi du coup de cœur:', err);
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
