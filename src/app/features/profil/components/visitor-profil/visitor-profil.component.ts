import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { combineLatest, map, Observable, switchMap, take } from 'rxjs';
import { ConversationService } from 'src/app/features/conversation/services/conversation.service';
import { MatchService } from 'src/app/features/match/services/match.service';
import { User } from 'src/app/features/user/models/user';
import { UserService } from 'src/app/features/user/services/user.service';
import { UserStoreService } from 'src/app/features/user/store/user-store.service';

@Component({
  selector: 'app-visitor-profil',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './visitor-profil.component.html',
  styleUrl: './visitor-profil.component.scss',
})
export class VisitorProfilComponent implements OnInit {
  private _route = inject(ActivatedRoute);
  private _userService = inject(UserService);
  private _router = inject(Router);
  private _matchService = inject(MatchService);
  private _userStore = inject(UserStoreService);
  private _conversationService = inject(ConversationService);

  data$!: Observable<{ user: User; saloonId: number }>;
  myId = this._userStore.getUserId();
  winkSent = false;

  ngOnInit(): void {
    this.data$ = combineLatest([this._route.paramMap, this._route.queryParamMap]).pipe(
      switchMap(([params, queryParams]) => {
        const id = Number(params.get('id'));
        const saloonId = Number(queryParams.get('saloonId'));

        // Vérifie via l'API si un wink a déjà été envoyé
        if (this.myId) {
          this._matchService.hasLiked(Number(this.myId), id).subscribe({
            next: res => {
              this.winkSent = res.hasLiked;
            },
            error: () => {
              this.winkSent = false;
            },
          });
        }

        return this._userService.getUserById(id).pipe(map(user => ({ user, saloonId })));
      })
    );
  }

  goBack(): void {
    this.data$.pipe(take(1)).subscribe(({ saloonId }) => {
      this._router.navigate(['/mysaloon', saloonId]);
    });
  }

  private _computeAge(birthDateISO: string): number {
    const d = new Date(birthDateISO);
    const diff = Date.now() - d.getTime();
    return Math.abs(new Date(diff).getUTCFullYear() - 1970);
  }

  wink(): void {
    if (this.winkSent) return;

    const myId = this._userStore.getUserId();

    this.data$.pipe(take(1)).subscribe(({ user, saloonId }) => {
      const otherId = user?.id;
      if (!myId || !otherId || myId === otherId) {
        return;
      }

      this._matchService.createLike(myId, otherId).subscribe({
        next: res => {
          this.winkSent = true;

          if (res.message === "It's a match!") {
            this._conversationService.createConversation(otherId).subscribe();
            this._router.navigate(['/match', myId, otherId], { queryParams: { saloonId } });
          }
        },
        error: () => {
          // En cas d'erreur, on considère que le like existe peut-être déjà
          this.winkSent = true;
        },
      });
    });
  }
}
