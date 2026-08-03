import { CommonModule, registerLocaleData } from '@angular/common';
import localeFr from '@angular/common/locales/fr';
import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { BehaviorSubject, catchError, EMPTY, switchMap, tap } from 'rxjs';
import {
  AdminService,
  SaloonDetailStats,
  SaloonStatsChartPoint,
} from '../../services/admin.service';

type StatsPeriod = SaloonDetailStats['period'];
type HourlyMode = 'ACTUAL' | 'USUAL';
type StatsRequest = {
  period: StatsPeriod;
  date: string;
  referenceWeeks: number;
  weekDay: string;
};

registerLocaleData(localeFr);

@Component({
  selector: 'app-saloon-detail-stats-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './saloon-detail-stats-page.component.html',
  styleUrl: './saloon-detail-stats-page.component.scss',
})
export class SaloonDetailStatsPageComponent implements OnInit {
  private readonly _adminService = inject(AdminService);
  private readonly _route = inject(ActivatedRoute);
  private readonly _router = inject(Router);
  private readonly _destroyRef = inject(DestroyRef);
  private readonly _saloonId = Number(this._route.snapshot.paramMap.get('id'));
  private readonly _request$ = new BehaviorSubject<StatsRequest>({
    period: 'DAY',
    date: this._today(),
    referenceWeeks: 8,
    weekDay: this._currentWeekDay(),
  });

  readonly periods: { value: StatsPeriod; label: string }[] = [
    { value: 'DAY', label: 'Jour' },
    { value: 'WEEK', label: 'Semaine' },
    { value: 'MONTH', label: 'Mois' },
    { value: 'YEAR', label: 'Année' },
  ];
  readonly referenceWeekOptions = [4, 8, 12];
  readonly weekDays = [
    { value: 'MONDAY', label: 'Lundi' },
    { value: 'TUESDAY', label: 'Mardi' },
    { value: 'WEDNESDAY', label: 'Mercredi' },
    { value: 'THURSDAY', label: 'Jeudi' },
    { value: 'FRIDAY', label: 'Vendredi' },
    { value: 'SATURDAY', label: 'Samedi' },
    { value: 'SUNDAY', label: 'Dimanche' },
  ];
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly stats = signal<SaloonDetailStats | null>(null);
  period: StatsPeriod = 'DAY';
  selectedDate = this._today();
  maxDate = this._today();
  referenceWeeks = 8;
  selectedWeekDay = this._currentWeekDay();
  hourlyMode: HourlyMode = 'ACTUAL';

  ngOnInit(): void {
    this._request$
      .pipe(
        tap(() => {
          this.loading.set(true);
          this.error.set(null);
        }),
        switchMap(request =>
          this._adminService
            .getSaloonDetailStats(
              this._saloonId,
              request.period,
              request.date,
              request.referenceWeeks,
              request.weekDay
            )
            .pipe(
              catchError(error => {
                this.error.set(
                  error?.status === 404 ? 'Saloon introuvable' : 'Statistiques indisponibles'
                );
                this.loading.set(false);
                return EMPTY;
              })
            )
        ),
        takeUntilDestroyed(this._destroyRef)
      )
      .subscribe({
        next: stats => {
          this.stats.set(stats);
          this.loading.set(false);
        },
      });
  }

  selectPeriod(period: StatsPeriod): void {
    this.period = period;
    this._reload();
  }

  onDateChange(): void {
    if (this.selectedDate > this.maxDate) {
      this.selectedDate = this.maxDate;
    }
    this._reload();
  }

  onReferenceChange(): void {
    this._reload();
  }

  onWeekDayChange(): void {
    this._reload();
  }

  selectHourlyMode(mode: HourlyMode): void {
    this.hourlyMode = mode;
  }

  movePeriod(direction: number): void {
    const date = new Date(`${this.selectedDate}T12:00:00`);
    if (this.period === 'DAY') date.setDate(date.getDate() + direction);
    if (this.period === 'WEEK') date.setDate(date.getDate() + direction * 7);
    if (this.period === 'MONTH') date.setMonth(date.getMonth() + direction);
    if (this.period === 'YEAR') date.setFullYear(date.getFullYear() + direction);
    this.selectedDate = this._formatLocalDate(date);
    this.onDateChange();
  }

  goBack(): void {
    void this._router.navigate(['/dashboard/saloons-stats']);
  }

  barHeight(point: SaloonStatsChartPoint, points: SaloonStatsChartPoint[]): string {
    const max = Math.max(...points.map(item => item.value), 1);
    return `${Math.max((point.value / max) * 100, point.value > 0 ? 4 : 1)}%`;
  }

  chartLabel(label: string): string {
    return this.period === 'DAY' ? label.slice(0, 4) : label;
  }

  signedValue(value: number): string {
    return `${value > 0 ? '+' : ''}${value.toLocaleString('fr-FR', {
      maximumFractionDigits: 2,
    })}`;
  }

  weekDayName(value: string): string {
    return this.weekDays.find(day => day.value === value)?.label || value;
  }

  private _reload(): void {
    this._request$.next({
      period: this.period,
      date: this.selectedDate,
      referenceWeeks: this.referenceWeeks,
      weekDay: this.selectedWeekDay,
    });
  }

  private _today(): string {
    return this._formatLocalDate(new Date());
  }

  private _formatLocalDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private _currentWeekDay(): string {
    const days = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
    return days[new Date().getDay()];
  }
}
