import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NavbarComponent } from 'src/app/common/components/navbar/navbar.component';
import { UserStoreService } from 'src/app/features/user/store/user-store.service';
import { AuthApiService } from 'src/app/features/auth/services/auth-api.service';
import { UserDTO } from 'src/app/features/user/models/userDTO';
import { VersionedImageUrlPipe } from 'src/app/common/pipes/versioned-image-url.pipe';

@Component({
  selector: 'app-mon-compte-page',
  standalone: true,
  imports: [CommonModule, RouterModule, NavbarComponent, VersionedImageUrlPipe],
  templateUrl: './mon-compte-page.component.html',
  styleUrls: ['./mon-compte-page.component.scss'],
})
export class MonComptePageComponent implements OnInit {
  private _userStore = inject(UserStoreService);
  private _authService = inject(AuthApiService);

  readonly premiumActionsEnabled = false;
  user = signal<UserDTO | null>(null);
  isPremium = computed(() => {
    return this.user()?.isPremium ?? false;
  });
  canChangePassword = computed(() => {
    return (this.user()?.authProvider || 'EMAIL').toUpperCase() === 'EMAIL';
  });
  displayName = computed(() => {
    const user = this.user();
    if (!user) return '';
    return user.userName ? `@${user.userName}` : `${user.firstName} ${user.lastName}`.trim();
  });
  displayCity = computed(() => {
    return this.user()?.city || 'Ville non renseignée';
  });

  ngOnInit(): void {
    this._userStore.getUserConnected$().subscribe(user => {
      if (user && user.id) {
        this.user.set(user);
      }
    });
  }

  getInitials(): string {
    const u = this.user();
    if (!u) return '?';
    const first = u.firstName?.charAt(0) || '';
    const last = u.lastName?.charAt(0) || '';
    return (first + last).toUpperCase() || '?';
  }

  goToPremium(): void {
    // TODO: Navigation vers la page premium
  }

  getProfileDisplayImage(): string | null {
    return this.user()?.imgUrl || null;
  }

  logout(): void {
    this._authService.logout();
  }
}
