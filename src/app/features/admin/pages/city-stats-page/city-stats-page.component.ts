import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminService, CityStats } from '../../services/admin.service';

@Component({
  selector: 'app-city-stats-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './city-stats-page.component.html',
  styleUrl: './city-stats-page.component.scss',
})
export class CityStatsPageComponent implements OnInit {
  private _adminService = inject(AdminService);

  stats: CityStats | null = null;
  isLoading = true;
  error: string | null = null;

  ngOnInit(): void {
    this.loadStats();
  }

  loadStats(): void {
    this.isLoading = true;
    this.error = null;

    this._adminService.getCityStatistics().subscribe({
      next: data => {
        this.stats = data;
        this.isLoading = false;
      },
      error: err => {
        this.error = 'Erreur lors du chargement des statistiques';
        this.isLoading = false;
        console.error(err);
      },
    });
  }

  getCityEntries(): { city: string; totalUsers: number; connectedUsers: number }[] {
    if (!this.stats) return [];

    const cities = new Set([
      ...Object.keys(this.stats.usersByCity || {}),
      ...Object.keys(this.stats.connectedUsersByCity || {}),
    ]);

    return Array.from(cities)
      .map(city => ({
        city,
        totalUsers: this.stats?.usersByCity?.[city] || 0,
        connectedUsers: this.stats?.connectedUsersByCity?.[city] || 0,
      }))
      .sort((a, b) => b.connectedUsers - a.connectedUsers);
  }

  getTotalConnected(): number {
    if (!this.stats?.connectedUsersByCity) return 0;
    return Object.values(this.stats.connectedUsersByCity).reduce((sum, count) => sum + count, 0);
  }
}
