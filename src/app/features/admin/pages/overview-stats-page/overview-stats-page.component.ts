import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StatsApiService, OverviewStats } from '../../services/stats-api.service';

@Component({
  selector: 'app-overview-stats-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './overview-stats-page.component.html',
  styleUrl: './overview-stats-page.component.scss',
})
export class OverviewStatsPageComponent implements OnInit {
  private _statsService = inject(StatsApiService);

  stats: OverviewStats | null = null;
  isLoading = true;
  error: string | null = null;

  ngOnInit(): void {
    this.loadStats();
  }

  loadStats(): void {
    this.isLoading = true;
    this._statsService.getOverview().subscribe({
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
}
