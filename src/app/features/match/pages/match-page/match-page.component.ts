import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { combineLatest, map, Observable, switchMap } from 'rxjs';
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

  users$!: Observable<{ user1: User; user2: User }>;
  saloonId: number | null = null;

  ngOnInit(): void {
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
          throw new Error('User IDs manquants');
        }
        return combineLatest([this._userService.getUserById(userId1), this._userService.getUserById(userId2)]).pipe(
          map(([user1, user2]) => ({ user1, user2 }))
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
