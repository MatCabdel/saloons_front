import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  StatsApiService,
  PremiumStats,
  PeriodRange,
  TimeSeriesPoint,
} from '../../services/stats-api.service';
import { PeriodFilterComponent } from '../../components/period-filter/period-filter.component';

@Component({
  selector: 'app-premium-stats-page',
  standalone: true,
  imports: [CommonModule, PeriodFilterComponent],
  templateUrl: './premium-stats-page.component.html',
  styleUrl: './premium-stats-page.component.scss',
})
export class PremiumStatsPageComponent implements OnInit {
  private _statsService = inject(StatsApiService);

  stats: PremiumStats | null = null;
  isLoading = true;
  error: string | null = null;
  currentPeriod!: PeriodRange;

  ngOnInit(): void {
    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - 30);
    this.currentPeriod = {
      from: this._formatDate(from),
      to: this._formatDate(to),
    };
    this.loadStats();
  }

  onPeriodChange(period: PeriodRange): void {
    this.currentPeriod = period;
    this.loadStats();
  }

  loadStats(): void {
    this.isLoading = true;
    this.error = null;
    this._statsService.getPremiumStats(this.currentPeriod).subscribe({
      next: data => {
        this.stats = data;
        this.isLoading = false;
      },
      error: err => {
        this.error = 'Erreur lors du chargement des statistiques premium';
        this.isLoading = false;
        console.error(err);
      },
    });
  }

  getMaxValue(series: TimeSeriesPoint[]): number {
    if (!series || series.length === 0) return 1;
    return Math.max(...series.map(p => p.value), 1);
  }

  getBarHeight(value: number, max: number): string {
    return `${Math.max((value / max) * 100, 2)}%`;
  }

  formatBarLabel(dateStr: string): string {
    const d = new Date(dateStr);
    return `${d.getDate()}/${d.getMonth() + 1}`;
  }

  getRankedBarWidth(value: number, max: number): string {
    return `${Math.max((value / max) * 100, 5)}%`;
  }

  private _formatDate(d: Date): string {
    return d.toISOString().split('T')[0];
  }
}
