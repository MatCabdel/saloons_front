import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { VersionedImageUrlPipe } from 'src/app/common/pipes/versioned-image-url.pipe';
import { map, Observable } from 'rxjs';
import { UserDTO } from 'src/app/features/user/models/userDTO';
import { UserStoreService } from 'src/app/features/user/store/user-store.service';

@Component({
  selector: 'app-my-profil',
  standalone: true,
  imports: [CommonModule, VersionedImageUrlPipe],
  templateUrl: './my-profil.component.html',
  styleUrl: './my-profil.component.scss',
})
export class MyProfilComponent {
  private _userStore = inject(UserStoreService);
  private _router = inject(Router);

  user$: Observable<UserDTO | null> = this._userStore.getUserConnected$().pipe(
    map(u => {
      if (!u || !u.birthDate) return u;
      const d = new Date(u.birthDate);
      const diff = Date.now() - d.getTime();
      const age = Math.abs(new Date(diff).getUTCFullYear() - 1970);
      return { ...u, age };
    })
  );

  navigateToEdit(): void {
    this._router.navigate(['/profil/edit']);
  }

  getDisplayName(user: UserDTO): string {
    return user.userName || `${user.firstName} ${user.lastName}`.trim();
  }
}
