import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminService, SaloonsByCityStats, SaloonStatsItem } from '../../services/admin.service';

@Component({
  selector: 'app-saloons-stats-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './saloons-stats-page.component.html',
  styleUrl: './saloons-stats-page.component.scss',
})
export class SaloonsStatsPageComponent implements OnInit {
  private _adminService = inject(AdminService);

  stats: SaloonsByCityStats | null = null;
  isLoading = true;
  error: string | null = null;
  expandedCities = new Set<string>();

  ngOnInit(): void {
    this.loadStats();
  }

  loadStats(): void {
    this.isLoading = true;
    this.error = null;

    this._adminService.getSaloonsStatisticsByCity().subscribe({
      next: data => {
        this.stats = data;
        this.isLoading = false;
        // Expand first city by default
        const cities = this.getCities();
        if (cities.length > 0) {
          this.expandedCities.add(cities[0]);
        }
      },
      error: err => {
        this.error = 'Erreur lors du chargement des statistiques';
        this.isLoading = false;
        console.error(err);
      },
    });
  }

  getCities(): string[] {
    if (!this.stats?.saloonCountByCity) return [];
    return Object.keys(this.stats.saloonCountByCity).sort((a, b) => {
      const countA = this.stats?.saloonCountByCity[a] || 0;
      const countB = this.stats?.saloonCountByCity[b] || 0;
      return countB - countA;
    });
  }

  getSaloonsForCity(city: string): SaloonStatsItem[] {
    return this.stats?.saloonsByCity?.[city] || [];
  }

  getSaloonCount(city: string): number {
    return this.stats?.saloonCountByCity?.[city] || 0;
  }

  getTotalConnectedInCity(city: string): number {
    const saloons = this.getSaloonsForCity(city);
    return saloons.reduce((sum, s) => sum + s.connectedCount, 0);
  }

  getTotalSaloons(): number {
    if (!this.stats?.saloonCountByCity) return 0;
    return Object.values(this.stats.saloonCountByCity).reduce((sum, count) => sum + count, 0);
  }

  getTotalConnected(): number {
    if (!this.stats?.saloonsByCity) return 0;
    return Object.values(this.stats.saloonsByCity)
      .flat()
      .reduce((sum, s) => sum + s.connectedCount, 0);
  }

  toggleCity(city: string): void {
    if (this.expandedCities.has(city)) {
      this.expandedCities.delete(city);
    } else {
      this.expandedCities.add(city);
    }
  }

  isCityExpanded(city: string): boolean {
    return this.expandedCities.has(city);
  }
}
