import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HeaderComponent } from 'src/app/common/components/header/header.component';
import { UserStoreService } from 'src/app/features/user/store/user-store.service';
import { AuthApiService } from 'src/app/features/auth/services/auth-api.service';
import { UserDTO } from 'src/app/features/user/models/userDTO';

@Component({
  selector: 'app-mon-compte-page',
  standalone: true,
  imports: [CommonModule, HeaderComponent, RouterModule],
  templateUrl: './mon-compte-page.component.html',
  styleUrls: ['./mon-compte-page.component.scss'],
})
export class MonComptePageComponent implements OnInit {
  private _userStore = inject(UserStoreService);
  private _authService = inject(AuthApiService);

  user = signal<UserDTO | null>(null);
  isPremium = computed(() => {
    return this.user()?.isPremium ?? false;
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

  logout(): void {
    this._authService.logout();
  }
}
