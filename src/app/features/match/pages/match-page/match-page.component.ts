import { Component, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ConversationService } from 'src/app/features/conversation/services/conversation.service';
import { User } from 'src/app/features/user/models/user';
import { UserService } from 'src/app/features/user/services/user.service';

@Component({
  selector: 'app-match-page',
  standalone: true,
  imports: [],
  templateUrl: './match-page.component.html',
  styleUrl: './match-page.component.scss',
})
export class MatchPageComponent {
  private _route = inject(ActivatedRoute);
  private _router = inject(Router);
  private _userService = inject(UserService);
  private _conversationService = inject(ConversationService);

  user1: User | null = null;
  user2: User | null = null;

  constructor() {
    const userId1 = Number(this._route.snapshot.paramMap.get('userId1'));
    const userId2 = Number(this._route.snapshot.paramMap.get('userId2'));
    if (userId1) {
      this._userService.getUserById(userId1).subscribe(user => (this.user1 = user));
    }
    if (userId2) {
      this._userService.getUserById(userId2).subscribe(user => (this.user2 = user));
    }
  }

  openChat(): void {
    if (!this.user2) return;
    this._conversationService.createConversation(this.user2.id).subscribe(conversation => {
      this._router.navigate(['/messages', conversation.id]);
    });
  }
}
