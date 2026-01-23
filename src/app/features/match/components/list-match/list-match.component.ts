import { Component, inject, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { MatchService } from '../../services/match.service';
import { ConversationService } from 'src/app/features/conversation/services/conversation.service';
import { UserStoreService } from 'src/app/features/user/store/user-store.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-list-match',
  standalone: true,
  imports: [],
  templateUrl: './list-match.component.html',
  styleUrl: './list-match.component.scss',
})
export class ListMatchComponent implements OnInit, OnChanges {
  matches: any[] = [];
  allMatches: any[] = [];
  userIdsWithConversations: number[] = [];
  @Input() excludeUserIds: number[] = [];

  private _matchService = inject(MatchService);
  private _conversationService = inject(ConversationService);
  private _userStore = inject(UserStoreService);
  private _router = inject(Router);

  myId = 0;

  ngOnInit(): void {
    this.myId = this._userStore.getUserId();
    this._matchService.getMatches().subscribe(users => {
      this._conversationService.getUserConversations().subscribe(conversations => {
        // Exclure les utilisateurs qui ont déjà une conversation (active ou expirée)
        this.userIdsWithConversations = conversations.payload
          .flatMap(conv => conv.participants)
          .filter(p => p.id !== this.myId)
          .map(p => p.id);

        this.allMatches = users;
        this.filterMatches();
      });
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['excludeUserIds']) {
      this.filterMatches();
    }
  }

  filterMatches(): void {
    // Exclure les utilisateurs avec conversation ET ceux passés en input
    const allExcluded = [...new Set([...this.userIdsWithConversations, ...this.excludeUserIds])];
    this.matches = this.allMatches.filter(u => !allExcluded.includes(u.id));
  }

  openConversationWith(user: any): void {
    if (!user?.id) {
      return;
    }

    // Vérifier si une conversation existe déjà
    this._conversationService.getUserConversations().subscribe(conversations => {
      const conv = conversations.payload.find(c => c.participants.some((p: any) => p.id === user.id));
      if (conv) {
        // Conversation existe → naviguer vers elle
        this._router.navigate(['/messages', conv.id]);
      } else {
        // Pas de conversation → ouvrir en mode "match" (conversation sera créée au premier message)
        this._router.navigate(['/messages/match', user.id]);
      }
    });
  }
}
