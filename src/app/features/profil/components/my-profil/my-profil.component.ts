import { Component, inject } from '@angular/core';
import { UserDTO } from 'src/app/features/user/models/userDTO';
import { UserStoreService } from 'src/app/features/user/store/user-store.service';

@Component({
  selector: 'app-my-profil',
  standalone: true,
  imports: [],
  templateUrl: './my-profil.component.html',
  styleUrl: './my-profil.component.scss',
})
export class MyProfilComponent {

  private _userStore = inject(UserStoreService);
  user: UserDTO | null = null;

  constructor() {
    this._userStore.getUserConnected$().subscribe(user => {
      this.user = user;
    });
  }
}
