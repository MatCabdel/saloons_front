import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { combineLatest, map, Observable, switchMap } from 'rxjs';
import { User } from 'src/app/features/user/models/user';
import { UserService } from 'src/app/features/user/services/user.service';

@Component({
  selector: 'app-heart-confirmed-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './heart-confirmed-page.component.html',
  styleUrl: './heart-confirmed-page.component.scss',
})
export class HeartConfirmedPageComponent implements OnInit {
  private _route = inject(ActivatedRoute);
  private _router = inject(Router);
  private _userService = inject(UserService);

  users$!: Observable<{ user1: User; user2: User }>;
  conversationId: number | null = null;

  ngOnInit(): void {
    // Récupère le conversationId depuis les queryParams
    this._route.queryParamMap.subscribe(params => {
      const id = params.get('conversationId');
      this.conversationId = id ? Number(id) : null;
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

  continueConversation(): void {
    if (this.conversationId) {
      this._router.navigate(['/messages', this.conversationId]);
    } else {
      this._router.navigate(['/chat']);
    }
  }

  goBack(): void {
    this._router.navigate(['/chat']);
  }
}
