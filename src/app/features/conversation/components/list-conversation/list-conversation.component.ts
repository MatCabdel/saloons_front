import { Component, inject, OnInit } from '@angular/core';
import { SwitchMessageTypeComponent } from '../switch-message-type/switch-message-type.component';
import { ConversationService } from '../../services/conversation.service';
import { Router } from '@angular/router';
import { User } from 'src/app/features/user/models/user';
import { Conversation } from '../../models/Conversation';
import { UserStoreService } from 'src/app/features/user/store/user-store.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-list-conversation',
  standalone: true,
  imports: [SwitchMessageTypeComponent, CommonModule],
  templateUrl: './list-conversation.component.html',
  styleUrl: './list-conversation.component.scss',
})
export class ListConversationComponent implements OnInit {
  conversations: Conversation[] = [];

  private _conversationService = inject(ConversationService);
  private _router = inject(Router);
  private _userStore = inject(UserStoreService);

  myId = this._userStore.getUserId();

  ngOnInit(): void {
    this._conversationService.getUserConversations().subscribe(data => {
      this.conversations = Array.isArray(data.payload) ? data.payload.filter(conv => conv && conv.id !== undefined) : [];
    });
  }

  openConversation(conversationId: number): void {
    this._router.navigate(['/messages', conversationId]);
  }

  otherParticipant(conv: Conversation): User | undefined {
    return conv.participants.find(p => p.id !== this.myId);
  }
}
