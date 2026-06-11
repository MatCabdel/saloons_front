import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { combineLatest, EMPTY, map, Observable, switchMap } from 'rxjs';
import { User } from 'src/app/features/user/models/user';
import { UserService } from 'src/app/features/user/services/user.service';
import { MatchService } from '../../services/match.service';
import { UserStoreService } from 'src/app/features/user/store/user-store.service';
import { VersionedImageUrlPipe } from 'src/app/common/pipes/versioned-image-url.pipe';

@Component({
  selector: 'app-match-page',
  standalone: true,
  imports: [CommonModule, VersionedImageUrlPipe],
  templateUrl: './match-page.component.html',
  styleUrl: './match-page.component.scss',
})
export class MatchPageComponent implements OnInit {
  private _route = inject(ActivatedRoute);
  private _router = inject(Router);
  private _userService = inject(UserService);
  private _matchService = inject(MatchService);
  private _userStore = inject(UserStoreService);

  users$!: Observable<{ user1: User; user2: User }>;
  saloonId: number | null = null;

  ngOnInit(): void {
    const myId = this._userStore.getUserId();

    // Récupère le saloonId depuis les queryParams
    this._route.queryParamMap.subscribe(params => {
      const id = params.get('saloonId');
      this.saloonId = id ? Number(id) : null;
    });

    this.users$ = this._route.paramMap.pipe(
      switchMap(params => {
        const userId1 = Number(params.get('userId1'));
        const userId2 = Number(params.get('userId2'));

        if (!userId1 || !userId2) {
          this._router.navigate(['/saloons']);
          return EMPTY;
        }

        // Sécurité : l'utilisateur connecté doit être l'un des deux
        if (myId !== userId1 && myId !== userId2) {
          this._router.navigate(['/saloons']);
          return EMPTY;
        }

        // Vérifier que le match existe réellement côté backend
        const otherUserId = myId === userId1 ? userId2 : userId1;
        return this._matchService.getMatches().pipe(
          switchMap(matches => {
            const matchExists = matches.some(m => m.id === otherUserId);
            if (!matchExists) {
              this._router.navigate(['/saloons']);
              return EMPTY;
            }
            return combineLatest([
              this._userService.getUserById(userId1),
              this._userService.getUserById(userId2),
            ]).pipe(map(([user1, user2]) => ({ user1, user2 })));
          })
        );
      })
    );
  }

  openChat(user2: User): void {
    // Naviguer vers la page messages en mode match (conversation sera créée au premier message)
    this._router.navigate(['/messages/match', user2.id], {
      queryParams: this.saloonId ? { saloonId: this.saloonId } : {},
    });
  }

  goBackToSaloon(): void {
    if (this.saloonId) {
      this._router.navigate(['/mysaloon', this.saloonId]);
    } else {
      this._router.navigate(['/saloons']);
    }
  }
}
