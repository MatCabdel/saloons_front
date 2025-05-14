import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
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
  private _userService = inject(UserService);

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
}
