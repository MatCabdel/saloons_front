import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

// ============ Types ============

export type TimeSeriesPoint = {
  date: string;
  value: number;
};

export type RankedItem = {
  id?: number;
  name: string;
  value: number;
};

export type HeatmapPoint = {
  dayOfWeek: number;
  hour: number;
  value: number;
};

export type OverviewStats = {
  totalUsers: number;
  activeUsers: number;
  premiumUsers: number;
  totalSaloons: number;
  connectedUsers: number;
  totalMatches: number;
  totalConversations: number;
  totalMessages: number;
  citiesCovered: number;
  profilesCompleted: number;
};

export type GrowthStats = {
  newUsersPerDay: TimeSeriesPoint[];
  totalNewUsers: number;
  retentionD1: number;
  retentionD7: number;
  retentionD30: number;
  churnedUsers: number;
  churnRate: number;
  dau: number;
  wau: number;
  mau: number;
};

export type SaloonEngagementStats = {
  entriesPerDay: TimeSeriesPoint[];
  totalEntries: number;
  uniqueVisitors: number;
  avgSaloonsPerUser: number | null;
  topSaloons: RankedItem[];
  uniqueVisitorsPerSaloon: RankedItem[];
  entriesByCity: RankedItem[];
};

export type MatchChatStats = {
  matchesPerDay: TimeSeriesPoint[];
  totalMatches: number;
  conversationsStarted: number;
  totalMessages: number;
  avgMessagesPerConversation: number | null;
  heartRequestsSent: number;
  matchRatePerEntry: number;
  heartRequestsPerDay: TimeSeriesPoint[];
};

export type PremiumStats = {
  totalPremium: number;
  newSubscriptions: number;
  conversionRate: number;
  premiumByCity: RankedItem[];
  subscriptionsPerDay: TimeSeriesPoint[];
};

export type GeographyStats = {
  entriesByCity: RankedItem[];
  activityHeatmap: HeatmapPoint[];
  totalCities: number;
};

export type FunnelStats = {
  totalRegistered: number;
  profileCompleted: number;
  enteredSaloon: number;
  matched: number;
  conversationStarted: number;
  heartRequestSent: number;
  returnedD1: number;
  pctNeverEnteredSaloon: number;
  pctEnteredNoMatch: number;
};

export type PeriodRange = {
  from: string; // yyyy-MM-dd
  to: string;
};

@Injectable({
  providedIn: 'root',
})
export class StatsApiService {
  private _http = inject(HttpClient);
  private readonly _BASE_URL = `${environment.apiUrl}/admin/stats`;

  getOverview(): Observable<OverviewStats> {
    return this._http.get<OverviewStats>(`${this._BASE_URL}/overview`);
  }

  getGrowthStats(period: PeriodRange): Observable<GrowthStats> {
    // prettier-ignore
    const params = new HttpParams()
      .set('from', period.from)
      .set('to', period.to);
    return this._http.get<GrowthStats>(`${this._BASE_URL}/growth`, { params });
  }

  getEngagementStats(period: PeriodRange): Observable<SaloonEngagementStats> {
    // prettier-ignore
    const params = new HttpParams()
      .set('from', period.from)
      .set('to', period.to);
    return this._http.get<SaloonEngagementStats>(`${this._BASE_URL}/engagement`, { params });
  }

  getMatchChatStats(period: PeriodRange): Observable<MatchChatStats> {
    // prettier-ignore
    const params = new HttpParams()
      .set('from', period.from)
      .set('to', period.to);
    return this._http.get<MatchChatStats>(`${this._BASE_URL}/match-chat`, { params });
  }

  getPremiumStats(period: PeriodRange): Observable<PremiumStats> {
    // prettier-ignore
    const params = new HttpParams()
      .set('from', period.from)
      .set('to', period.to);
    return this._http.get<PremiumStats>(`${this._BASE_URL}/premium`, { params });
  }

  getGeographyStats(period: PeriodRange): Observable<GeographyStats> {
    // prettier-ignore
    const params = new HttpParams()
      .set('from', period.from)
      .set('to', period.to);
    return this._http.get<GeographyStats>(`${this._BASE_URL}/geography`, { params });
  }

  getFunnelStats(): Observable<FunnelStats> {
    return this._http.get<FunnelStats>(`${this._BASE_URL}/funnel`);
  }
}
