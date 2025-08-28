import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { UserDTO } from 'src/app/features/user/models/userDTO';
import { UserStoreService } from 'src/app/features/user/store/user-store.service';

@Component({
  selector: 'app-my-profil',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './my-profil.component.html',
  styleUrl: './my-profil.component.scss',
})
export class MyProfilComponent {
  private _userStore = inject(UserStoreService);

  user$: Observable<UserDTO | null> = this._userStore.getUserConnected$();
}
