import { Component, inject, signal } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { APP_ROUTES } from '../../constants/routes.constant';
import { trigger, transition, style, animate } from '@angular/animations';
import { AuthApiService } from 'src/app/features/auth/services/auth-api.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
  animations: [
    trigger('slideIn', [
      transition(':enter', [style({ transform: 'translateX(100%)' }), animate('300ms ease-out', style({ transform: 'translateX(0)' }))]),
      transition(':leave', [animate('200ms ease-in', style({ transform: 'translateX(100%)' }))]),
    ]),
  ],
})
export class HeaderComponent {
  private _router = inject(Router);
  private _authService = inject(AuthApiService);

  isMenuOpen = signal(false);

  menuItems = [
    { route: '/saloons', icon: 'assets/icons/home.svg', label: 'Accueil' },
    { route: '/profil', icon: 'assets/icons/user.svg', label: 'Mon profil' },
    { route: '/chat', icon: 'assets/icons/chat3.svg', label: 'Messages' },
  ];

  public navigateToWelcome(): void {
    this._router.navigate([APP_ROUTES.SALOONS]);
    this.closeMenu();
  }

  toggleMenu(): void {
    this.isMenuOpen.update(v => !v);
  }

  closeMenu(): void {
    this.isMenuOpen.set(false);
  }

  logout(): void {
    this._authService.logout();
    this.closeMenu();
  }
}
