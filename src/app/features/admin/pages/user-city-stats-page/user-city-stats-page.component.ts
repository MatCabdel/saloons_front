import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  AdminService,
  UserCityStats,
  MonthlyActiveByCityPoint,
} from '../../services/admin.service';

type CityRow = {
  city: string;
  registered: number;
  active: number;
  activeRate: number;
};

type MonthLabel = {
  year: number;
  month: number;
  label: string;
};

@Component({
  selector: 'app-user-city-stats-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './user-city-stats-page.component.html',
  styleUrl: './user-city-stats-page.component.scss',
})
export class UserCityStatsPageComponent implements OnInit {
  private _adminService = inject(AdminService);

  stats: UserCityStats | null = null;
  isLoading = true;
  error: string | null = null;

  cityRows: CityRow[] = [];
  monthLabels: MonthLabel[] = [];
  // monthlyMatrix[city][monthIndex] = count
  monthlyMatrix: Record<string, number[]> = {};
  allCities: string[] = [];

  private readonly _MONTH_NAMES = [
    'Jan',
    'Fév',
    'Mar',
    'Avr',
    'Mai',
    'Juin',
    'Juil',
    'Août',
    'Sep',
    'Oct',
    'Nov',
    'Déc',
  ];

  ngOnInit(): void {
    this.loadStats();
  }

  loadStats(): void {
    this.isLoading = true;
    this.error = null;

    this._adminService.getUserCityStats().subscribe({
      next: data => {
        this.stats = data;
        this._buildCityRows(data);
        this._buildMonthlyMatrix(data.monthlyActiveByCity);
        this.isLoading = false;
      },
      error: err => {
        this.error = 'Erreur lors du chargement des statistiques';
        this.isLoading = false;
        console.error(err);
      },
    });
  }

  private _buildCityRows(data: UserCityStats): void {
    const allCities = new Set([
      ...Object.keys(data.registeredByCity),
      ...Object.keys(data.activeByCity),
    ]);

    this.cityRows = Array.from(allCities)
      .map(city => {
        const registered = data.registeredByCity[city] ?? 0;
        const active = data.activeByCity[city] ?? 0;
        const activeRate = registered > 0 ? Math.round((active / registered) * 100) : 0;
        return { city, registered, active, activeRate };
      })
      .sort((a, b) => b.registered - a.registered);
  }

  private _buildMonthlyMatrix(points: MonthlyActiveByCityPoint[]): void {
    // Collect unique sorted months
    const monthSet = new Map<string, MonthLabel>();
    for (const p of points) {
      const key = `${p.year}-${p.month}`;
      if (!monthSet.has(key)) {
        monthSet.set(key, {
          year: p.year,
          month: p.month,
          label: `${this._MONTH_NAMES[p.month - 1]} ${p.year}`,
        });
      }
    }
    this.monthLabels = Array.from(monthSet.values()).sort((a, b) =>
      a.year !== b.year ? a.year - b.year : a.month - b.month
    );

    // Collect unique cities (sorted by total activity)
    const cityTotals: Record<string, number> = {};
    for (const p of points) {
      cityTotals[p.city] = (cityTotals[p.city] ?? 0) + p.count;
    }
    this.allCities = Object.keys(cityTotals).sort((a, b) => cityTotals[b] - cityTotals[a]);

    // Build matrix
    this.monthlyMatrix = {};
    for (const city of this.allCities) {
      this.monthlyMatrix[city] = this.monthLabels.map(() => 0);
    }
    for (const p of points) {
      const monthIdx = this.monthLabels.findIndex(m => m.year === p.year && m.month === p.month);
      if (monthIdx >= 0 && this.monthlyMatrix[p.city]) {
        this.monthlyMatrix[p.city][monthIdx] = p.count;
      }
    }
  }

  getTotalRegistered(): number {
    if (!this.stats) return 0;
    return Object.values(this.stats.registeredByCity).reduce((s, v) => s + v, 0);
  }

  getTotalActive(): number {
    if (!this.stats) return 0;
    return Object.values(this.stats.activeByCity).reduce((s, v) => s + v, 0);
  }

  getTotalCities(): number {
    return this.cityRows.length;
  }

  getMaxRegistered(): number {
    return this.cityRows.length > 0 ? this.cityRows[0].registered : 1;
  }

  getBarWidth(value: number): number {
    const max = this.getMaxRegistered();
    return max > 0 ? Math.round((value / max) * 100) : 0;
  }

  getMaxInMatrix(): number {
    let max = 1;
    for (const city of this.allCities) {
      for (const v of this.monthlyMatrix[city] ?? []) {
        if (v > max) max = v;
      }
    }
    return max;
  }

  getCellOpacity(value: number): number {
    const max = this.getMaxInMatrix();
    return max > 0 ? value / max : 0;
  }
}
