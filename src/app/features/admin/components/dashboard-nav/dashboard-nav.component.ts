import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

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
  ];

  constructor(private _router: Router) {}

  toggleMenu(item: MenuItem): void {
    item.expanded = !item.expanded;
  }

  navigate(route: string): void {
    this._router.navigate(['dashboard', route]);
  }

  isActive(route: string): boolean {
    return this._router.url.includes(route);
  }
}
