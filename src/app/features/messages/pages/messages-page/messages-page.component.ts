import { Component, HostListener, inject, OnInit, signal } from '@angular/core';
import { HeaderComponent } from '../../../../common/components/header/header.component';
import { MessagerieComponent } from '../../components/messagerie/messagerie.component';
import { ActivatedRoute, Router } from '@angular/router';
import { ConversationService } from 'src/app/features/conversation/services/conversation.service';
import { ReportModalComponent, ReportModalData } from 'src/app/features/report/components/report-modal/report-modal.component';
import { User } from 'src/app/features/user/models/user';
import { UserStoreService } from 'src/app/features/user/store/user-store.service';

@Component({
  selector: 'app-messages-page',
  standalone: true,
  imports: [HeaderComponent, MessagerieComponent, ReportModalComponent],
  templateUrl: './messages-page.component.html',
  styleUrl: './messages-page.component.scss',
})
export class MessagesPageComponent implements OnInit {
  private _router = inject(Router);
  private _route = inject(ActivatedRoute);
  private _conversationService = inject(ConversationService);
  private _userStore = inject(UserStoreService);
  userTarget?: User;
  conversationId!: number;
  otherParticipantLeft = false;

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
      next: conv => {
        const myId = this._userStore.getUserId();
        this.userTarget = conv.participants.find((u: User) => u.id !== myId);
        this.otherParticipantLeft = conv.otherParticipantLeft || false;
      },
      error: err => {
        // Si 403, l'utilisateur a été supprimé de la conversation
        if (err.status === 403) {
          this._router.navigate(['/chat']);
        }
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
