import { Component, EventEmitter, inject, OnInit, Output } from '@angular/core';
import { SwitchMessageTypeComponent } from '../switch-message-type/switch-message-type.component';
import { ConversationService } from '../../services/conversation.service';
import { Router } from '@angular/router';
import { User } from 'src/app/features/user/models/user';
import { Conversation } from '../../models/Conversation';
import { UserStoreService } from 'src/app/features/user/store/user-store.service';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from '../../../../common/components/navbar/navbar.component';
import { map, Observable, tap } from 'rxjs';

@Component({
  selector: 'app-list-conversation',
  standalone: true,
  imports: [SwitchMessageTypeComponent, CommonModule, NavbarComponent],
  templateUrl: './list-conversation.component.html',
  styleUrl: './list-conversation.component.scss',
})
export class ListConversationComponent implements OnInit {
  conversations$!: Observable<Conversation[]>;
  @Output() conversationUserIdsChange = new EventEmitter<number[]>();

  private _conversationService = inject(ConversationService);
  private _router = inject(Router);
  private _userStore = inject(UserStoreService);

  myId = this._userStore.getUserId();

  ngOnInit(): void {
    this.conversations$ = this._conversationService.getUserConversations().pipe(
      map(data => (Array.isArray(data.payload) ? data.payload.filter(conv => conv && conv.id !== undefined) : [])),
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

  openConversation(conversationId: number): void {
    this._router.navigate(['/messages', conversationId]);
  }

  otherParticipant(conv: Conversation): User | undefined {
    return conv.participants.find(p => p.id !== this.myId);
  }
}
