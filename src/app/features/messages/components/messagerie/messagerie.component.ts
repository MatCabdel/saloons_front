import { Component, inject, OnInit } from '@angular/core';
import { ConversationService } from 'src/app/features/conversation/services/conversation.service';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WebSocketService } from 'src/app/common/services/web-socket.service';
import { User } from 'src/app/features/user/models/user';
import { UserStoreService } from 'src/app/features/user/store/user-store.service';
import { UserService } from 'src/app/features/user/services/user.service';
import { Message } from 'src/app/features/conversation/models/Conversation';

@Component({
  selector: 'app-messagerie',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './messagerie.component.html',
  styleUrl: './messagerie.component.scss',
})
export class MessagerieComponent implements OnInit {
  conversationId!: number;
  messages: Message[] = [];
  newMessage = '';
  myId!: number;
  myImgUrl?: string;
  participants: User[] = [];

  private _route = inject(ActivatedRoute);
  private _conversationService = inject(ConversationService);
  private _webSocketService = inject(WebSocketService);
  private _userStore = inject(UserStoreService);
  private _userService = inject(UserService);

  ngOnInit(): void {
    this.conversationId = +this._route.snapshot.paramMap.get('conversationId')!;
    this.myId = Number(this._userStore.getUserId());

    this._conversationService.getConversation(this.conversationId).subscribe(conv => {
      this.participants = conv.participants ?? [];
      const me = this.participants.find(p => p.id === this.myId);
      if (me && Array.isArray(me.imgUrl) && me.imgUrl.length > 0) {
        this.myImgUrl = me.imgUrl[0].url as string;
      } else if (me && typeof me.imgUrl === 'string') {
        this.myImgUrl = me.imgUrl;
      } else {
        this.myImgUrl = undefined;
      }

      this._conversationService.getMessages(this.conversationId).subscribe(data => {
        this.messages = data.map(msg => ({
          ...msg,
          sender: Number(msg.sender ?? msg.senderId),
        }));
      });

      this._webSocketService.connect(this.conversationId);
      this._webSocketService.getMessages().subscribe(msg => {
        msg.sender = Number(msg.sender);
        if (
          !this.messages.some(
            m => m.content === msg.content && m.sender === msg.sender && new Date(m.sentAt).getTime() === new Date(msg.sentAt).getTime()
          )
        ) {
          this.messages.push(msg);
        }
      });
    });
  }

  loadMessages(): void {
    this._conversationService.getMessages(this.conversationId).subscribe(data => {
      this.messages = data.map(msg => ({
        ...msg,
        sender: Number(msg.sender),
      }));
    });
  }

  getUserImg(senderId: number): string | undefined {
    const participant = this.participants?.find(p => p.id === senderId);
    if (participant) {
      if (Array.isArray(participant.imgUrl) && participant.imgUrl.length > 0) {
        return participant.imgUrl[0].url as string;
      }
      if (typeof participant.imgUrl === 'string') {
        return participant.imgUrl;
      }
    }
    return 'assets/img/default-avatar.png';
  }

  sendMessage(): void {
    const chatMessage = {
      conversation: { id: this.conversationId },
      sender: this.myId,
      senderName: this.participants.find(p => p.id === this.myId)?.userName ?? 'Moi',
      content: this.newMessage,
      sentAt: new Date(),
      type: 'CHAT',
    };
    this._webSocketService.sendMessage(chatMessage);
    this.newMessage = '';
  }

  getUserName(senderId: number): string | undefined {
    if (senderId === this.myId) {
      return this.participants.find(p => p.id === this.myId)?.userName ?? 'Moi';
    }
    return this.participants.find(p => p.id === senderId)?.userName;
  }
}
