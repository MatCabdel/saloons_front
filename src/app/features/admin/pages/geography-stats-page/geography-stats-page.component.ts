import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  StatsApiService,
  GeographyStats,
  PeriodRange,
  HeatmapPoint,
} from '../../services/stats-api.service';
import { PeriodFilterComponent } from '../../components/period-filter/period-filter.component';

@Component({
  selector: 'app-geography-stats-page',
  standalone: true,
  imports: [CommonModule, PeriodFilterComponent],
  templateUrl: './geography-stats-page.component.html',
  styleUrl: './geography-stats-page.component.scss',
})
export class GeographyStatsPageComponent implements OnInit {
  private _statsService = inject(StatsApiService);

  stats: GeographyStats | null = null;
  isLoading = true;
  error: string | null = null;
  currentPeriod!: PeriodRange;

  dayLabels = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
  hours = Array.from({ length: 24 }, (_, i) => i);

  // Heatmap matrix: [day][hour] => value
  heatmapMatrix: number[][] = [];
  heatmapMax = 1;

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
    this._statsService.getGeographyStats(this.currentPeriod).subscribe({
      next: data => {
        this.stats = data;
        this._buildHeatmapMatrix(data.activityHeatmap);
        this.isLoading = false;
      },
      error: err => {
        this.error = 'Erreur lors du chargement des statistiques géographiques';
        this.isLoading = false;
        console.error(err);
      },
    });
  }

  private _buildHeatmapMatrix(points: HeatmapPoint[]): void {
    // Initialize 7 days x 24 hours matrix
    this.heatmapMatrix = Array.from({ length: 7 }, () => Array(24).fill(0));
    this.heatmapMax = 1;

    if (!points || points.length === 0) return;

    for (const p of points) {
      const dayIdx = p.dayOfWeek - 1; // 1-based to 0-based
      if (dayIdx >= 0 && dayIdx < 7 && p.hour >= 0 && p.hour < 24) {
        this.heatmapMatrix[dayIdx][p.hour] = p.value;
        if (p.value > this.heatmapMax) {
          this.heatmapMax = p.value;
        }
      }
    }
  }

  getHeatmapColor(value: number): string {
    if (value === 0) return 'rgba(255, 255, 255, 0.03)';
    const intensity = value / this.heatmapMax;
    // Gradient from dark teal to bright green-yellow
    if (intensity < 0.25) {
      return `rgba(17, 153, 142, ${0.2 + intensity * 1.2})`;
    }
    if (intensity < 0.5) {
      return `rgba(56, 239, 125, ${0.3 + intensity * 0.6})`;
    }
    if (intensity < 0.75) {
      return `rgba(255, 193, 34, ${0.4 + intensity * 0.5})`;
    }
    return `rgba(255, 152, 0, ${0.6 + intensity * 0.4})`;
  }

  formatHour(h: number): string {
    return `${h.toString().padStart(2, '0')}h`;
  }

  getRankedBarWidth(value: number, max: number): string {
    return `${Math.max((value / max) * 100, 5)}%`;
  }

  private _formatDate(d: Date): string {
    return d.toISOString().split('T')[0];
  }
}
