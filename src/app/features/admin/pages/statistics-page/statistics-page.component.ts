import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminService, DashboardStats, PremiumMonthlyStats } from '../../services/admin.service';

@Component({
  selector: 'app-statistics-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './statistics-page.component.html',
  styleUrl: './statistics-page.component.scss',
})
export class StatisticsPageComponent implements OnInit {
  private _adminService = inject(AdminService);

  stats: DashboardStats | null = null;
  premiumEvolution: PremiumMonthlyStats[] = [];
  isLoading = true;
  premiumEvolutionLoading = true;
  error: string | null = null;

  ngOnInit(): void {
    this.loadStats();
    this.loadPremiumEvolution();
  }

  loadStats(): void {
    this.isLoading = true;
    this._adminService.getStatistics().subscribe({
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

  loadPremiumEvolution(): void {
    this.premiumEvolutionLoading = true;
    this._adminService.getPremiumEvolution().subscribe({
      next: data => {
        this.premiumEvolution = data;
        this.premiumEvolutionLoading = false;
      },
      error: err => {
        this.premiumEvolutionLoading = false;
        console.error(err);
      },
    });
  }

  getCityEntries(): { city: string; count: number }[] {
    if (!this.stats?.saloonsByCity) return [];
    return Object.entries(this.stats.saloonsByCity).map(([city, count]) => ({ city, count }));
  }

  getBarHeight(value: number): number {
    if (this.premiumEvolution.length === 0) return 0;
    const maxValue = Math.max(...this.premiumEvolution.map(m => m.activeSubscriptions), 1);
    return (value / maxValue) * 100;
  }

  isCurrentMonth(month: PremiumMonthlyStats): boolean {
    const now = new Date();
    return month.year === now.getFullYear() && month.month === now.getMonth() + 1;
  }
}
