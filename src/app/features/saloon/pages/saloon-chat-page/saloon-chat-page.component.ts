import {
  Component,
  inject,
  OnInit,
  OnDestroy,
  ViewChild,
  ElementRef,
  AfterViewChecked,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HeaderComponent } from 'src/app/common/components/header/header.component';
import { UserStoreService } from 'src/app/features/user/store/user-store.service';
import { SaloonApiService } from '../../services/saloon-api.service';
import {
  SaloonChatService,
  SaloonMessageDTO,
  CHAT_MIN_PARTICIPANTS,
} from '../../services/saloon-chat.service';
import { Observable, Subscription } from 'rxjs';
import { Saloon } from '../../models/saloonModel';
import { PresenceService } from '../../services/presence.service';
import { PresenceWebSocketService } from '../../services/presence-websocket.service';

@Component({
  selector: 'app-saloon-chat-page',
  standalone: true,
  imports: [CommonModule, FormsModule, HeaderComponent],
  templateUrl: './saloon-chat-page.component.html',
  styleUrl: './saloon-chat-page.component.scss',
})
export class SaloonChatPageComponent implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild('messagesList') private _messagesListRef!: ElementRef;

  private _route = inject(ActivatedRoute);
  private _router = inject(Router);
  private _userStore = inject(UserStoreService);
  private _saloonApi = inject(SaloonApiService);
  private _chatService = inject(SaloonChatService);
  private _presenceService = inject(PresenceService);
  private _presenceWsService = inject(PresenceWebSocketService);

  saloonId!: number;
  saloon$!: Observable<Saloon>;
  myId = Number(this._userStore.getUserId());
  newMessage = '';
  messages: SaloonMessageDTO[] = [];
  isLoading = true;
  connectedCount = 0;
  isChatEnabled = false;
  joinedAt: Date | null = null;
  sessionEndsAt: Date | null = null;

  private _shouldScroll = false;
  private _messageSubscription?: Subscription;
  private _saloonPresenceSubscription?: Subscription;

  /**
   * Nombre d'autres connectés (sans me compter)
   */
  get othersConnectedCount(): number {
    return Math.max(0, this.connectedCount - 1);
  }

  /**
   * Heure d'arrivée formatée pour affichage
   */
  get joinedAtFormatted(): string {
    if (!this.joinedAt) return '';
    return this.joinedAt.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  }

  ngOnInit(): void {
    this.saloonId = Number(this._route.snapshot.paramMap.get('saloonId'));
    this.saloon$ = this._saloonApi.getSaloonById(String(this.saloonId));

    // Charger l'historique du chat (avec joinedAt de la session)
    this._chatService.getChatHistory(this.saloonId, 50).subscribe({
      next: history => {
        this.messages = history.messages;
        this.joinedAt = new Date(history.joinedAt);
        this.sessionEndsAt = new Date(history.sessionEndsAt);
        this.connectedCount = history.connectedCount;
        this.isChatEnabled = this.connectedCount >= CHAT_MIN_PARTICIPANTS;

        // Mettre à jour le service avec les infos de session
        this._chatService.setJoinedAt(history.joinedAt, history.sessionEndsAt);

        this.isLoading = false;
        this._shouldScroll = true;
      },
      error: err => {
        console.error('Erreur chargement historique chat:', err);
        this.isLoading = false;
      },
    });

    // Se connecter au WebSocket (pour les messages en temps réel + présence)
    this._chatService.connectToSaloonChat(this.saloonId);

    // Présence du saloon (nombre de connectés dans le saloon, pas seulement dans le chat)
    this._presenceService.getPresence(this.saloonId).subscribe();
    this._presenceWsService.connect(this.saloonId);
    this._saloonPresenceSubscription = this._presenceService.currentPresence$.subscribe(
      presence => {
        if (presence) {
          this.connectedCount = presence.connectedCount;
          this.isChatEnabled = this.connectedCount >= CHAT_MIN_PARTICIPANTS;
        }
      }
    );

    // S'abonner aux nouveaux messages via WebSocket
    this._messageSubscription = this._chatService.messages$.subscribe(message => {
      // Éviter les doublons (le message qu'on vient d'envoyer)
      if (!this.messages.some(m => m.id === message.id)) {
        this.messages.push(message);
        this._shouldScroll = true;
      }
    });
  }

  ngAfterViewChecked(): void {
    if (this._shouldScroll) {
      this._scrollToBottom();
      this._shouldScroll = false;
    }
  }

  ngOnDestroy(): void {
    this._messageSubscription?.unsubscribe();
    this._saloonPresenceSubscription?.unsubscribe();
    this._chatService.disconnect();
    this._presenceWsService.disconnect();
  }

  sendMessage(): void {
    if (!this.newMessage.trim() || !this.isChatEnabled) return;

    const content = this.newMessage.trim();
    this.newMessage = '';

    this._chatService.sendMessage(this.saloonId, content).subscribe({
      next: message => {
        // Ajouter le message à la liste s'il n'y est pas déjà
        if (!this.messages.some(m => m.id === message.id)) {
          this.messages.push(message);
          this._shouldScroll = true;
        }
      },
      error: err => {
        console.error('Erreur envoi message:', err);
        // Remettre le message dans l'input en cas d'erreur
        this.newMessage = content;
      },
    });
  }

  onEnterPress(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  goToUserProfile(userId: number): void {
    this._router.navigate(['/profil-visitor', userId]);
  }

  goBack(): void {
    this._router.navigate(['/mysaloon', this.saloonId]);
  }

  private _scrollToBottom(): void {
    if (this._messagesListRef) {
      const el = this._messagesListRef.nativeElement;
      el.scrollTop = el.scrollHeight;
    }
  }
}
