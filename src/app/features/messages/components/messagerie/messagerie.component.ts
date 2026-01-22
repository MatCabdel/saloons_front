import {
  AfterViewChecked,
  AfterViewInit,
  Component,
  DestroyRef,
  ElementRef,
  EventEmitter,
  inject,
  Input,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';
import { ConversationService } from 'src/app/features/conversation/services/conversation.service';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WebSocketService } from 'src/app/common/services/web-socket.service';
import { User } from 'src/app/features/user/models/user';
import { UserStoreService } from 'src/app/features/user/store/user-store.service';
import { UserService } from 'src/app/features/user/services/user.service';
import { Message, HeartRequestStatus } from 'src/app/features/conversation/models/Conversation';
import { combineLatest, map, mergeMap, Observable, of, switchMap, tap } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-messagerie',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './messagerie.component.html',
  styleUrl: './messagerie.component.scss',
})
export class MessagerieComponent implements OnInit, AfterViewInit, AfterViewChecked {
  @Input() isConversationEnded = false; // Conversation expirée (a quitté le saloon)
  @Input() isMatchCancelled = false; // Match annulé définitivement
  @Input() isPermanent = false; // Conversation permanente
  @Input() heartRequestStatus: HeartRequestStatus | null = null;
  @Input() heartRequestCountdown = '';
  @Input() heartRequestSending = false;
  @Output() sendHeartRequestClicked = new EventEmitter<void>();

  conversationId!: number;
  messages: Message[] = [];
  newMessage = '';
  myId!: number;
  myImgUrl?: string;
  participants: User[] = [];

  private _hasScrolledToBottom = false;

  @ViewChild('messagesList', { static: false }) messagesList!: ElementRef<HTMLDivElement>;

  private _route = inject(ActivatedRoute);
  private _conversationService = inject(ConversationService);
  private _webSocketService = inject(WebSocketService);
  private _userStore = inject(UserStoreService);
  private _userService = inject(UserService);
  private _destroyRef = inject(DestroyRef);

  ngOnInit(): void {
    this.conversationId = +this._route.snapshot.paramMap.get('conversationId')!;
    this.myId = Number(this._userStore.getUserId());

    const conversation$ = this._conversationService.getConversation(this.conversationId);
    const messages$ = conversation$.pipe(switchMap(() => this._conversationService.getMessages(this.conversationId)));
    const webSocketMessages$ = conversation$.pipe(
      tap(() => this._webSocketService.connect(this.conversationId)),
      switchMap(() => this._webSocketService.getMessages())
    );

    combineLatest([conversation$, messages$])
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe(([conv, messages]) => {
        this.participants = conv.participants ?? [];
        this.setupMyImage();
        this.messages = messages.map(msg => ({
          ...msg,
          sender: Number(msg.sender ?? msg.senderId),
        }));

        this._hasScrolledToBottom = false;
        setTimeout(() => this.jumpToBottom(), 100);
      });

    webSocketMessages$
      .pipe(
        takeUntilDestroyed(this._destroyRef),
        mergeMap(msg => this.ensureParticipantExists(msg).pipe(map(() => msg)))
      )
      .subscribe(msg => {
        this.handleNewMessage(msg);

        setTimeout(() => this.jumpToBottom(), 50);
      });
  }
  ngAfterViewInit(): void {
    setTimeout(() => {
      if (!this._hasScrolledToBottom) {
        this.jumpToBottom();
      }
    }, 200);
  }

  ngAfterViewChecked(): void {
    if (this.messages.length > 0 && this.messagesList?.nativeElement) {
      const element = this.messagesList.nativeElement;
      if (element.scrollTop < element.scrollHeight - element.clientHeight - 10) {
        setTimeout(() => {
          this.jumpToBottom();
        }, 0);
      }
    }
  }

  public jumpToBottom(): void {
    try {
      if (this.messagesList && this.messagesList.nativeElement) {
        const element = this.messagesList.nativeElement;

        element.scrollTop = element.scrollHeight;
      } else {
        console.warn('⚠️ messagesList non disponible');
      }
    } catch (err) {
      console.warn('⚠️ Erreur positionnement:', err);
    }
  }

  setupMyImage(): void {
    const me = this.getParticipantById(this.myId);
    if (me && Array.isArray(me.imgUrl) && me.imgUrl.length > 0) {
      this.myImgUrl = me.imgUrl[0].url as string;
    } else if (me && typeof me.imgUrl === 'string') {
      this.myImgUrl = me.imgUrl;
    } else {
      this.myImgUrl = undefined;
    }
  }

  ensureParticipantExists(msg: Message): Observable<void> {
    const senderId = msg.sender;
    const participantExists = this.participants.find(p => p.id === senderId);

    if (participantExists) {
      return of(void 0);
    }

    return this._userService.getUserById(senderId).pipe(
      tap(response => {
        const user = (response as any)?.payload || response;
        this.participants.push(user);
      }),
      map(() => void 0)
    );
  }

  handleNewMessage(msg: Message): void {
    msg.sender = Number(msg.sender);

    const messageExists = this.messages.some(
      m => m.content === msg.content && m.sender === msg.sender && new Date(m.sentAt).getTime() === new Date(msg.sentAt).getTime()
    );

    if (!messageExists) {
      this.messages.push(msg);
    }
  }

  loadMessages(): void {
    this._conversationService
      .getMessages(this.conversationId)
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe(data => {
        this.messages = data.map(msg => ({
          ...msg,
          sender: Number(msg.sender),
        }));
      });
  }

  getParticipantById(id: number): User | undefined {
    return this.participants.find(p => p.id === id);
  }

  onEnterPress(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey && !event.ctrlKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  sendMessage(): void {
    if (!this.newMessage.trim()) {
      return;
    }

    const chatMessage = {
      conversation: { id: this.conversationId },
      sender: this.myId,
      senderName: this.getParticipantById(this.myId)?.userName ?? 'Moi',
      content: this.newMessage,
      sentAt: new Date(),
      type: 'CHAT',
    };

    this._webSocketService.sendMessage(chatMessage);

    this.newMessage = '';

    setTimeout(() => this.jumpToBottom(), 50);

    setTimeout((): void => {
      const textarea = document.querySelector('textarea');
      if (textarea) {
        textarea.style.height = 'auto';
        console.log('🔧 Textarea reset');
      }
    }, 0);
  }
}
