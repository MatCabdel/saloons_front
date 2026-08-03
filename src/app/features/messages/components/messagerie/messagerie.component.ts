import {
  AfterViewChecked,
  AfterViewInit,
  Component,
  DestroyRef,
  ElementRef,
  EventEmitter,
  inject,
  Input,
  OnDestroy,
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
import { PresenceService } from 'src/app/features/saloon/services/presence.service';
import {
  combineLatest,
  catchError,
  debounceTime,
  EMPTY,
  filter,
  map,
  mergeMap,
  Observable,
  of,
  Subject,
  switchMap,
  tap,
} from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { VersionedImageUrlPipe } from 'src/app/common/pipes/versioned-image-url.pipe';
import { BadgeService } from 'src/app/core/services/badge.service';
import { mergeAndSortMessages } from './message-sync';

@Component({
  selector: 'app-messagerie',
  standalone: true,
  imports: [CommonModule, FormsModule, VersionedImageUrlPipe],
  templateUrl: './messagerie.component.html',
  styleUrl: './messagerie.component.scss',
})
export class MessagerieComponent implements OnInit, OnDestroy, AfterViewInit, AfterViewChecked {
  @Input() isConversationEnded = false; // Conversation expirée (a quitté le saloon)
  @Input() isMatchCancelled = false; // Match annulé définitivement
  @Input() isMatchExpired = false; // Match expiré (session terminée, pas de conversation créée)
  @Input() isHeartWindowExpired = false; // Fenêtre 12h pour coup de cœur expirée
  @Input() isPermanent = false; // Conversation permanente
  @Input() heartRequestStatus: HeartRequestStatus | null = null;
  @Input() heartRequestCountdown = '';
  @Input() heartRequestSending = false;
  @Input() matchUserId: number | null = null; // Mode match sans conversation
  @Output() sendHeartRequestClicked = new EventEmitter<void>();
  @Output() conversationCreated = new EventEmitter<number>(); // Émis quand conversation créée

  conversationId: number | null = null;
  messages: Message[] = [];
  newMessage = '';
  myId!: number;
  myImgUrl?: string;
  participants: User[] = [];
  isMatchMode = false; // true si on est en mode match (pas de conversation)
  selectedMessageKey: string | null = null;

  private _hasScrolledToBottom = false;

  @ViewChild('messagesList', { static: false }) messagesList!: ElementRef<HTMLDivElement>;

  private _route = inject(ActivatedRoute);
  private _conversationService = inject(ConversationService);
  private _webSocketService = inject(WebSocketService);
  private _userStore = inject(UserStoreService);
  private _userService = inject(UserService);
  private _presenceService = inject(PresenceService);
  private _badgeService = inject(BadgeService);
  private _destroyRef = inject(DestroyRef);
  private _markAsRead$ = new Subject<void>();

  ngOnInit(): void {
    this.myId = Number(this._userStore.getUserId());

    const conversationIdParam = this._route.snapshot.paramMap.get('conversationId');
    const matchUserIdParam = this._route.snapshot.paramMap.get('matchUserId');

    if (conversationIdParam) {
      // Mode conversation existante
      this.conversationId = Number(conversationIdParam);
      this.isMatchMode = false;
      this._initConversationMode();
    } else if (matchUserIdParam || this.matchUserId) {
      // Mode match sans conversation
      const userId = this.matchUserId || Number(matchUserIdParam);
      this.isMatchMode = true;
      this._initMatchMode(userId);
    }
  }

  private _initConversationMode(): void {
    if (!this.conversationId) return;

    const conversation$ = this._conversationService.getConversation(this.conversationId);
    const messages$ = this._conversationService.getMessages(this.conversationId);

    combineLatest([conversation$, messages$])
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe(([conv, messages]) => {
        this.participants = conv.participants ?? [];
        this.setupMyImage();
        this._mergeMessages(messages);

        this._hasScrolledToBottom = false;
        setTimeout(() => this.jumpToBottom(), 100);
      });

    this._webSocketService
      .getMessages()
      .pipe(
        takeUntilDestroyed(this._destroyRef),
        filter(msg => Number(msg.conversationId) === Number(this.conversationId)),
        mergeMap(msg => this.ensureParticipantExists(msg).pipe(map(() => msg)))
      )
      .subscribe(msg => {
        this.handleNewMessage(msg);
        if (msg.sender !== this.myId) {
          this._markAsRead$.next();
        }
        setTimeout(() => this.jumpToBottom(), 50);
      });

    this._webSocketService
      .getConnectedConversations()
      .pipe(
        takeUntilDestroyed(this._destroyRef),
        filter(id => id === this.conversationId),
        switchMap(() => this._conversationService.getMessages(this.conversationId!))
      )
      .subscribe(messages => {
        const knownIds = new Set(this.messages.map(message => message.id));
        const hasRecoveredIncomingMessage = messages.some(
          message => !knownIds.has(Number(message.id)) && Number(message.senderId) !== this.myId
        );
        this._mergeMessages(messages);
        if (hasRecoveredIncomingMessage) {
          this._markAsRead$.next();
        }
      });

    this._markAsRead$
      .pipe(
        debounceTime(200),
        takeUntilDestroyed(this._destroyRef),
        switchMap(() =>
          this._conversationService.markAsRead(this.conversationId!).pipe(
            catchError(err => {
              console.error('Failed to mark incoming messages as read:', err);
              return EMPTY;
            })
          )
        )
      )
      .subscribe(() => void this._badgeService.refreshUnreadCount());

    this._badgeService.setActiveConversation(this.conversationId);
    this._webSocketService.connect(this.conversationId);
  }

  private _initMatchMode(matchUserId: number): void {
    // Charger l'utilisateur courant et l'utilisateur matché
    combineLatest([
      this._userService.getUserById(this.myId),
      this._userService.getUserById(matchUserId),
    ])
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe(([me, matchedUser]) => {
        this.participants = [me, matchedUser];
        this.setupMyImage();
      });

    // Pas de messages en mode match
    this.messages = [];
  }
  ngAfterViewInit(): void {
    setTimeout(() => {
      if (!this._hasScrolledToBottom) {
        this.jumpToBottom();
      }
    }, 200);
  }

  ngAfterViewChecked(): void {
    if (
      !this._hasScrolledToBottom &&
      this.messages.length > 0 &&
      this.messagesList?.nativeElement
    ) {
      const element = this.messagesList.nativeElement;
      if (element.scrollTop < element.scrollHeight - element.clientHeight - 10) {
        setTimeout(() => {
          this.jumpToBottom();
        }, 0);
      }
    }
  }

  ngOnDestroy(): void {
    if (this.conversationId && this._badgeService.isConversationActive(this.conversationId)) {
      this._badgeService.setActiveConversation(null);
    }
    this._webSocketService.disconnect();
  }

  public jumpToBottom(): void {
    try {
      if (this.messagesList && this.messagesList.nativeElement) {
        const element = this.messagesList.nativeElement;
        element.scrollTo({ top: element.scrollHeight, behavior: 'auto' });
        this._hasScrolledToBottom = true;
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
    if (!this.conversationId || Number(msg.conversationId) !== Number(this.conversationId)) {
      return;
    }

    msg.sender = Number(msg.sender);

    const messageExists = this.messages.some(m => m.id === msg.id);

    if (!messageExists) {
      this.messages = mergeAndSortMessages(this.messages, [msg], this.conversationId);
    }
  }

  private _mergeMessages(messages: any[]): void {
    this.messages = mergeAndSortMessages(this.messages, messages, this.conversationId);
  }

  toggleMessageTime(msg: Message, index: number): void {
    const key = this._getMessageKey(msg, index);
    this.selectedMessageKey = this.selectedMessageKey === key ? null : key;
  }

  isMessageTimeVisible(msg: Message, index: number): boolean {
    return this.selectedMessageKey === this._getMessageKey(msg, index);
  }

  shouldShowDateSeparator(index: number): boolean {
    if (index === 0) {
      return true;
    }

    const currentMessage = this.messages[index];
    const previousMessage = this.messages[index - 1];

    if (!currentMessage || !previousMessage) {
      return false;
    }

    return !this._isSameDay(currentMessage.sentAt, previousMessage.sentAt);
  }

  getDateSeparatorLabel(sentAt: string): string {
    const messageDate = new Date(sentAt);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    if (this._isSameDay(messageDate, today)) {
      return "Aujourd'hui";
    }

    if (this._isSameDay(messageDate, yesterday)) {
      return 'Hier';
    }

    return new Intl.DateTimeFormat('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: messageDate.getFullYear() === today.getFullYear() ? undefined : 'numeric',
    }).format(messageDate);
  }

  private _getMessageKey(msg: Message, index: number): string {
    return msg.id ? `id-${msg.id}` : `local-${index}-${msg.sender}-${msg.sentAt}`;
  }

  private _isSameDay(firstDate: string | Date, secondDate: string | Date): boolean {
    const first = new Date(firstDate);
    const second = new Date(secondDate);

    return (
      first.getFullYear() === second.getFullYear() &&
      first.getMonth() === second.getMonth() &&
      first.getDate() === second.getDate()
    );
  }

  loadMessages(): void {
    if (!this.conversationId) return;

    this._conversationService
      .getMessages(this.conversationId)
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe(data => {
        this._mergeMessages(data);
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
    if (this._isSendingDisabled()) {
      return;
    }

    if (!this.newMessage.trim()) {
      return;
    }

    // En mode match, créer d'abord la conversation
    if (this.isMatchMode && !this.conversationId) {
      const matchUserId =
        this.matchUserId || Number(this._route.snapshot.paramMap.get('matchUserId'));
      if (!matchUserId) return;

      const saloonIdParam = this._route.snapshot.queryParamMap.get('saloonId');
      const activeSession = this._presenceService.getActiveSessionValue();
      const saloonId =
        activeSession?.saloonId ?? (saloonIdParam ? Number(saloonIdParam) : undefined);
      this._conversationService.createConversation(matchUserId, saloonId).subscribe({
        next: conv => {
          this.conversationId = conv.id;
          this.isMatchMode = false;
          this.conversationCreated.emit(conv.id);

          // Connecter au WebSocket
          this._badgeService.setActiveConversation(conv.id);
          this._webSocketService.connect(conv.id);

          // S'abonner aux messages WebSocket
          this._webSocketService
            .getMessages()
            .pipe(
              takeUntilDestroyed(this._destroyRef),
              mergeMap(msg => this.ensureParticipantExists(msg).pipe(map(() => msg)))
            )
            .subscribe(msg => {
              this.handleNewMessage(msg);
              setTimeout(() => this.jumpToBottom(), 50);
            });

          // Attendre un court délai que le WebSocket soit connecté
          setTimeout(() => {
            this._sendChatMessage();
          }, 300);
        },
        error: err => {
          console.error('Erreur création conversation:', err);
        },
      });
    } else {
      this._sendChatMessage();
    }
  }

  private _sendChatMessage(): void {
    if (!this.conversationId || this._isSendingDisabled()) return;

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
      }
    }, 0);
  }

  private _isSendingDisabled(): boolean {
    return (
      this.isMatchExpired ||
      this.isMatchCancelled ||
      (this.isConversationEnded && !this.isPermanent)
    );
  }
}
