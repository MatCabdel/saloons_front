import { Component, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ConversationService } from 'src/app/features/conversation/services/conversation.service';
import { MatchService } from 'src/app/features/match/services/match.service';
import { User } from 'src/app/features/user/models/user';
import { UserService } from 'src/app/features/user/services/user.service';
import { UserStoreService } from 'src/app/features/user/store/user-store.service';

@Component({
  selector: 'app-visitor-profil',
  standalone: true,
  imports: [],
  templateUrl: './visitor-profil.component.html',
  styleUrl: './visitor-profil.component.scss',
})
export class VisitorProfilComponent {
  private _route = inject(ActivatedRoute);
  private _userService = inject(UserService);
  private _router = inject(Router);
  private _matchService = inject(MatchService);
  private _userStore = inject(UserStoreService);
  private _conversationService = inject(ConversationService);

  user: User | null = null;
  saloonId: number | null = null;
  myId = this._userStore.getUserId();

  constructor() {
    const id = Number(this._route.snapshot.paramMap.get('id'));
    const saloonId = Number(this._route.snapshot.queryParamMap.get('saloonId'));
    this.saloonId = saloonId;
    if (id) {
      this._userService.getUserById(id).subscribe(user => {
        this.user = user;
      });
    }
  }

  goBack(): void {
    this._router.navigate(['/mysaloon', this.saloonId]);
  }

  wink(): void {
    const myId = this._userStore.getUserId();
    const otherId = this.user?.id;
    if (!myId || !otherId || myId === otherId) {
      return;
    }
    this._matchService.createLike(myId, otherId).subscribe({
      next: res => {
        if (res.message === "It's a match!") {
          this._conversationService.createConversation(otherId).subscribe();
          this._router.navigate(['/match', myId, otherId]);
        } else {
          alert(res.message);
        }
      },
      error: err => {
        alert(err.error?.message || err.error || 'Erreur');
      },
    });
  }
}
