import { Component, inject, input, signal } from '@angular/core';
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
      transition(':enter', [
        style({ transform: 'translateX(100%)' }),
        animate('300ms ease-out', style({ transform: 'translateX(0)' })),
      ]),
      transition(':leave', [animate('200ms ease-in', style({ transform: 'translateX(100%)' }))]),
    ]),
  ],
})
export class HeaderComponent {
  private _router = inject(Router);
  private _authService = inject(AuthApiService);

  showBackButton = input(false);
  backRoute = input<string>('');
  showMenu = input(true);
  usePageBackground = input(false);

  isMenuOpen = signal(false);

  menuItems = [
    { route: '/mon-compte', icon: 'assets/icons/user.svg', label: 'Mon compte' },
    { route: '/saloon-demande', icon: 'assets/icons/saloon.svg', label: 'Saloon à la demande' },
    { route: '/faq', icon: 'assets/icons/faq.svg', label: 'FAQ' },
    { route: '/contact', icon: 'assets/icons/contact.svg', label: 'Contact' },
    { route: '/mentions-legales', icon: 'assets/icons/faq.svg', label: 'Mentions légales' },
  ];

  public navigateToWelcome(): void {
    this._router.navigate([APP_ROUTES.SALOONS]);
    this.closeMenu();
  }

  goBack(): void {
    if (this.backRoute()) {
      this._router.navigate([this.backRoute()]);
    } else {
      window.history.back();
    }
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
