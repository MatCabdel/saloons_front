import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { PanelService } from '../../services/panel.service';
import { AuthApiService } from '../../../features/auth/services/auth-api.service';
import { UserStoreService } from '../../../features/user/store/user-store.service';

@Component({
  selector: 'app-right-panel',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './right-panel.component.html',
  styleUrl: './right-panel.component.scss',
})
export class RightPanelComponent {
  private _panelService = inject(PanelService);
  private _authService = inject(AuthApiService);
  private _userStore = inject(UserStoreService);
  private _router = inject(Router);

  isOpen$: Observable<boolean> = this._panelService.isOpen$;

  public onOverlayClick(): void {
    this.close();
  }

  public onOverlayKey(event: KeyboardEvent): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.close();
    }
  }

  public stopPropagation(event: Event): void {
    event.stopPropagation();
  }

  public close(): void {
    this._panelService.close();
  }

  public onLogout(): void {
    this._authService.clearToken();
    localStorage.removeItem('user');
    this._userStore.setUserConnected(this._userStore.initializeUserFromStorage());
    this.close();
    this._router.navigate(['/login']);
  }
}
