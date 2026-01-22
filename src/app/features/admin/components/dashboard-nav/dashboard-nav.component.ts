import { Component, signal, HostListener, inject } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthApiService } from 'src/app/features/auth/services/auth-api.service';

type MenuItem = {
  label: string;
  icon: string;
  expanded: boolean;
  children: { label: string; route: string }[];
};

@Component({
  selector: 'app-dashboard-nav',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard-nav.component.html',
  styleUrl: './dashboard-nav.component.scss',
})
export class DashboardNavComponent {
  isOpen = signal(false);

  menuItems: MenuItem[] = [
    {
      label: 'Général',
      icon: 'chart-bar',
      expanded: true,
      children: [
        { label: 'Statistiques', route: 'statistics' },
        { label: 'Stats par ville', route: 'city-stats' },
        { label: 'Stats des saloons', route: 'saloons-stats' },
      ],
    },
    {
      label: 'Utilisateurs',
      icon: 'users',
      expanded: false,
      children: [{ label: 'Liste des utilisateurs', route: 'users-list' }],
    },
    {
      label: 'Saloons',
      icon: 'building',
      expanded: false,
      children: [
        { label: 'Créer un saloon', route: 'create-saloon' },
        { label: 'Liste des saloons', route: 'saloons-list' },
      ],
    },
    {
      label: 'Notifications',
      icon: 'bell',
      expanded: false,
      children: [{ label: 'Signalements', route: 'reports-list' }],
    },
  ];

  private _authService = inject(AuthApiService);

  constructor(private _router: Router) {}

  toggleMenu(item: MenuItem): void {
    item.expanded = !item.expanded;
  }

  toggleNav(): void {
    this.isOpen.update(v => !v);
  }

  closeNav(): void {
    this.isOpen.set(false);
  }

  @HostListener('window:resize')
  onResize(): void {
    if (window.innerWidth > 768) {
      this.isOpen.set(false);
    }
  }

  navigate(route: string): void {
    this._router.navigate(['dashboard', route]);
    this.closeNav();
  }

  isActive(route: string): boolean {
    return this._router.url.includes(route);
  }

  logout(): void {
    this._authService.logout();
  }
}
