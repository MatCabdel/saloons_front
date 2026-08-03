import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of, Subject } from 'rxjs';
import { AdminService, SaloonDetailStats } from '../../services/admin.service';
import { SaloonDetailStatsPageComponent } from './saloon-detail-stats-page.component';

const stats: SaloonDetailStats = {
  saloonId: 7,
  saloonName: 'Le Central',
  city: 'Lyon',
  currentPresence: 3,
  presenceAvailable: true,
  period: 'DAY',
  periodStart: '2026-07-23',
  periodEnd: '2026-07-23',
  totalConnections: 1,
  uniqueVisitors: 1,
  allTimeEntries: 12,
  allTimeUniqueVisitors: 8,
  connections: [{ label: '20 h – 21 h', value: 1 }],
  hourlyConnections: [{ label: '20 h – 21 h', value: 1 }],
  peakSlot: { label: '20 h – 21 h', value: 1 },
  thirtyDays: {
    currentStart: '2026-06-24',
    currentEnd: '2026-07-23',
    currentEntries: 6,
    currentUniqueVisitors: 4,
    previousStart: '2026-05-25',
    previousEnd: '2026-06-23',
    previousEntries: 3,
    evolutionPercent: 100,
  },
  referenceWeeks: 8,
  referencePeriodStart: '2026-05-25',
  referencePeriodEnd: '2026-07-19',
  weekDayAverages: [{ label: 'Lundi', value: 1.5 }],
  selectedWeekDay: 'THURSDAY',
  weekDayHourlyAverages: [{ label: '20 h – 21 h', value: 0.5 }],
  averagePeakSlot: { label: '20 h – 21 h', value: 0.5 },
  selectedDayComparison: {
    date: '2026-07-23',
    weekDay: 'Jeudi',
    entries: 1,
    usualAverage: 0.5,
    difference: 0.5,
    differencePercent: 100,
  },
  weeklySummary: {
    currentStart: '2026-07-20',
    currentEnd: '2026-07-23',
    currentEntries: 2,
    comparablePeriodAverage: 1.5,
    difference: 0.5,
    differencePercent: 33.33,
  },
  monthlySummary: {
    currentMonthEntries: 5,
    previousMonthEntries: 4,
    lastThreeCompleteMonthsAverage: 3,
    lastSixCompleteMonthsAverage: null,
    historyMessage: 'Historique insuffisant pour 6 mois.',
  },
  averagePerDay: 0.5,
  averagePerWeek: 2,
  averagePerMonth: 8,
  averagesPeriod: 'période de test',
};

describe('SaloonDetailStatsPageComponent', () => {
  const getStats = jest.fn(() => of(stats));
  const navigate = jest.fn();

  beforeEach(async () => {
    getStats.mockClear();
    navigate.mockClear();
    await TestBed.configureTestingModule({
      imports: [SaloonDetailStatsPageComponent],
      providers: [
        { provide: AdminService, useValue: { getSaloonDetailStats: getStats } },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: { get: () => '7' } } },
        },
        { provide: Router, useValue: { navigate } },
      ],
    }).compileComponents();
  });

  it('loads and displays the selected saloon', () => {
    const fixture = TestBed.createComponent(SaloonDetailStatsPageComponent);
    fixture.detectChanges();

    expect(getStats).toHaveBeenCalledWith(7, 'DAY', expect.any(String), 8, expect.any(String));
    expect(fixture.nativeElement.textContent).toContain('Le Central — Lyon');
    expect(fixture.nativeElement.textContent).toContain('3');
  });

  it('reloads when the period changes', () => {
    const fixture = TestBed.createComponent(SaloonDetailStatsPageComponent);
    fixture.detectChanges();

    fixture.componentInstance.selectPeriod('WEEK');

    expect(getStats).toHaveBeenLastCalledWith(7, 'WEEK', expect.any(String), 8, expect.any(String));
    expect(fixture.componentInstance.chartLabel('lun. 20/07')).toBe('lun. 20/07');
  });

  it('reloads the complete-week averages when the reference changes', () => {
    const fixture = TestBed.createComponent(SaloonDetailStatsPageComponent);
    fixture.detectChanges();

    fixture.componentInstance.referenceWeeks = 12;
    fixture.componentInstance.onReferenceChange();

    expect(getStats).toHaveBeenLastCalledWith(
      7,
      'DAY',
      expect.any(String),
      12,
      expect.any(String)
    );
  });

  it('switches the hourly display mode without reloading the statistics', () => {
    const fixture = TestBed.createComponent(SaloonDetailStatsPageComponent);
    fixture.detectChanges();

    fixture.componentInstance.selectHourlyMode('USUAL');
    fixture.detectChanges();

    expect(getStats).toHaveBeenCalledTimes(1);
    expect(fixture.nativeElement.textContent).toContain('habituellement le plus');
  });

  it('can retry after a request error', () => {
    const failedRequest = new Subject<SaloonDetailStats>();
    getStats.mockReturnValueOnce(failedRequest).mockReturnValueOnce(of(stats));
    const fixture = TestBed.createComponent(SaloonDetailStatsPageComponent);
    fixture.detectChanges();
    failedRequest.error({ status: 503 });

    fixture.componentInstance.onDateChange();

    expect(getStats).toHaveBeenCalledTimes(2);
    expect(fixture.componentInstance.stats()).toEqual(stats);
  });
});
