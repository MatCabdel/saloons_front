import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { combineLatest, map, Observable, switchMap } from 'rxjs';
import { ConversationService } from 'src/app/features/conversation/services/conversation.service';
import { User } from 'src/app/features/user/models/user';
import { UserService } from 'src/app/features/user/services/user.service';

@Component({
  selector: 'app-match-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './match-page.component.html',
  styleUrl: './match-page.component.scss',
})
export class MatchPageComponent implements OnInit {
  private _route = inject(ActivatedRoute);
  private _router = inject(Router);
  private _userService = inject(UserService);
  private _conversationService = inject(ConversationService);

  users$!: Observable<{ user1: User; user2: User }>;

  ngOnInit(): void {
    this.users$ = this._route.paramMap.pipe(
      switchMap(params => {
        const userId1 = Number(params.get('userId1'));
        const userId2 = Number(params.get('userId2'));

        if (!userId1 || !userId2) {
          throw new Error('User IDs manquants');
        }
        return combineLatest([this._userService.getUserById(userId1), this._userService.getUserById(userId2)]).pipe(
          map(([user1, user2]) => ({ user1, user2 }))
        );
      })
    );
  }

  openChat(user2: User): void {
    this._conversationService.createConversation(user2.id).subscribe(conversation => {
      this._router.navigate(['/messages', conversation.id]);
    });
  }
}
