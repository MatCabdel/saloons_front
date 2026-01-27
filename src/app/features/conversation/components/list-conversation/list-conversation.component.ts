import { Component, EventEmitter, HostListener, inject, OnInit, Output } from '@angular/core';
import { ConversationService } from '../../services/conversation.service';
import { Router } from '@angular/router';
import { User } from 'src/app/features/user/models/user';
import { Conversation } from '../../models/Conversation';
import { UserStoreService } from 'src/app/features/user/store/user-store.service';
import { CommonModule } from '@angular/common';
import { BehaviorSubject, map, Observable, switchMap, tap } from 'rxjs';

@Component({
  selector: 'app-list-conversation',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './list-conversation.component.html',
  styleUrl: './list-conversation.component.scss',
})
export class ListConversationComponent implements OnInit {
  conversations$!: Observable<Conversation[]>;
  @Output() conversationUserIdsChange = new EventEmitter<number[]>();

  openMenuId: number | null = null;
  private _refresh$ = new BehaviorSubject<void>(undefined);

  private _conversationService = inject(ConversationService);
  private _router = inject(Router);
  private _userStore = inject(UserStoreService);

  myId = 0;

  @HostListener('document:click')
  onDocumentClick(): void {
    // Ferme le menu si on clique en dehors
    if (this.openMenuId !== null) {
      this.openMenuId = null;
    }
  }

  ngOnInit(): void {
    this.myId = this._userStore.getUserId();

    this.conversations$ = this._refresh$.pipe(
      switchMap(() => this._conversationService.getUserConversations()),
      map(data =>
        Array.isArray(data.payload)
          ? data.payload.filter(conv => conv && conv.id !== undefined)
          : []
      ),
      map(conversations =>
        conversations.sort((a, b) => {
          if (!a.lastMessage && !b.lastMessage) return 0;
          if (!a.lastMessage) return 1;
          if (!b.lastMessage) return -1;

          const dateA = new Date(a.lastMessage.sentAt);
          const dateB = new Date(b.lastMessage.sentAt);
          return dateB.getTime() - dateA.getTime();
        })
      ),
      tap(conversations => {
        const ids = conversations
          .flatMap(conv => conv.participants)
          .filter(p => p.id !== this.myId)
          .map(p => p.id);
        this.conversationUserIdsChange.emit(ids);
      })
    );
  }

  toggleMenu(event: Event, conversationId: number): void {
    event.stopPropagation();
    this.openMenuId = this.openMenuId === conversationId ? null : conversationId;
  }

  confirmDeleteConversation(event: Event, conversationId: number): void {
    event.stopPropagation();
    this.openMenuId = null;

    if (confirm('Voulez-vous vraiment supprimer cette conversation ?')) {
      this._conversationService.deleteConversation(conversationId).subscribe({
        next: () => {
          this._refresh$.next();
        },
        error: err => {
          console.error('Erreur lors de la suppression:', err);
        },
      });
    }
  }

  openConversation(conversationId: number): void {
    this._router.navigate(['/messages', conversationId]);
  }

  otherParticipant(conv: Conversation): User | undefined {
    return conv.participants.find(p => p.id !== this.myId);
  }

  formatMessageTime(dateString: string | undefined): string {
    if (!dateString) return '';

    const date = new Date(dateString);
    const now = new Date();

    // Réinitialiser à minuit pour comparer les jours
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const messageDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    // Aujourd'hui - afficher l'heure
    if (messageDate.getTime() === today.getTime()) {
      return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    }

    // Hier
    if (messageDate.getTime() === yesterday.getTime()) {
      return 'Hier';
    }

    // Avant hier - afficher la date (ex: 13 sept. 2025)
    const months = [
      'janv.',
      'févr.',
      'mars',
      'avr.',
      'mai',
      'juin',
      'juil.',
      'août',
      'sept.',
      'oct.',
      'nov.',
      'déc.',
    ];
    return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
  }
}
