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
  styleUrl: './list-match.component.scss'
})
export class ListMatchComponent implements OnInit, OnChanges {
  matches: any[] = []; 
  allMatches: any[] = [];
  @Input() excludeUserIds: number[] = [];

  private _matchService = inject(MatchService); 
  private _conversationService = inject(ConversationService)
    private _userStore = inject(UserStoreService);
    private _router = inject(Router);
  
    myId = this._userStore.getUserId();

  ngOnInit(): void {
    this._matchService.getMatches().subscribe(users => {
      this._conversationService.getUserConversations().subscribe(conversations => {
        const userIdsWithMessages = conversations.payload
        .filter(conv => conv.lastMessage && conv.lastMessage.content && conv.lastMessage.content.length > 0)
        .flatMap(conv => conv.participants)
        .filter(p => p.id !== this.myId)
        .map(p => p.id);
  
        this.allMatches = users;
        this.matches = this.allMatches.filter(u => !userIdsWithMessages.includes(u.id));
      });
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['excludeUserIds']) {
      this.filterMatches();
    }
  }

  filterMatches(): void {
    this.matches = this.allMatches.filter(u => !this.excludeUserIds.includes(u.id));
  }

  openConversationWith(user: any): void {
    this._conversationService.getUserConversations().subscribe(conversations => {
      const conv = conversations.payload.find(conv =>
        conv.participants.some((p: any) => p.id === user.id)
      );
      if (conv) {
       
        this._router.navigate(['/messages', conv.id]);
      } else {
        this._conversationService.createConversation(user.id).subscribe(newConv => {
          this._router.navigate(['/messages', newConv.id]);
        });
      }
    });
  }

}
