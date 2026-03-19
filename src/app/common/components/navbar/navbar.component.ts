import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { BadgeService } from 'src/app/core/services/badge.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterModule, CommonModule],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss',
})
export class NavbarComponent implements OnInit, OnDestroy {
  private _router = inject(Router);
  private _badgeService = inject(BadgeService);
  private _unreadSub?: Subscription;

  unreadCount = 0;

  navItems = [
    { route: '/profil', icon: 'assets/icons/user.svg', alt: 'profil' },
    { route: '/saloons', icon: 'assets/icons/home.svg', alt: 'home' },
    { route: '/events', icon: 'assets/icons/calendar.svg', alt: 'événements' },
    { route: '/chat', icon: 'assets/icons/chat3.svg', alt: 'tchat' },
  ];

  ngOnInit(): void {
    // Charger le compteur initial de messages non lus
    this._badgeService.refreshUnreadCount();

    // S'abonner aux mises à jour temps réel
    this._unreadSub = this._badgeService.totalUnreadCount$.subscribe(count => {
      this.unreadCount = count;
    });
  }

  ngOnDestroy(): void {
    this._unreadSub?.unsubscribe();
  }

  isActive(route: string): boolean {
    return this._router.url.startsWith(route);
  }
}
