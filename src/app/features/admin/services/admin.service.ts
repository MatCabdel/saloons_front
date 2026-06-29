import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Saloon } from '../../saloon/models/saloonModel';
import { EventItem } from '../../event/models/event.model';
import { User } from '../../user/models/user';

export type DashboardStats = {
  totalUsers: number;
  activeUsers: number;
  premiumUsers: number;
  totalSaloons: number;
  saloonsByCity: Record<string, number>;
  connectedUsers: number;
  pendingReports: number;
};

export type PremiumMonthlyStats = {
  year: number;
  month: number;
  monthName: string;
  activeSubscriptions: number;
};

export type CityStats = {
  usersByCity: Record<string, number>;
  connectedUsersByCity: Record<string, number>;
};

export type SaloonStatsItem = {
  id: number;
  name: string;
  city: string;
  imgUrl: string;
  connectedCount: number;
  totalVisits: number;
  peakConnected: number;
};

export type SaloonsByCityStats = {
  saloonCountByCity: Record<string, number>;
  saloonsByCity: Record<string, SaloonStatsItem[]>;
};

export type MonthlyActiveByCityPoint = {
  year: number;
  month: number;
  city: string;
  count: number;
};

export type UserCityStats = {
  registeredByCity: Record<string, number>;
  activeByCity: Record<string, number>;
  monthlyActiveByCity: MonthlyActiveByCityPoint[];
};

export type CreateSaloonRequest = {
  name: string;
  imgUrl: string;
  address?: string;
  city?: string;
  country?: string;
  latitude: number;
  longitude: number;
  radiusMeters?: number | null;
  radiusUnlimited?: boolean;
  isPrivate?: boolean;
};

// Types for paginated responses
export type PagedResponse<T> = {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
};

export type PaginationParams = {
  page: number;
  size: number;
  sortBy: string;
  sortDir: 'asc' | 'desc';
  search?: string;
};

@Injectable({
  providedIn: 'root',
})
export class AdminService {
  private _http = inject(HttpClient);
  private readonly _BASE_URL = environment.apiUrl;

  getStatistics(): Observable<DashboardStats> {
    return this._http.get<DashboardStats>(`${this._BASE_URL}/admin/statistics`);
  }

  getPremiumEvolution(): Observable<PremiumMonthlyStats[]> {
    return this._http.get<PremiumMonthlyStats[]>(
      `${this._BASE_URL}/admin/statistics/premium-evolution`
    );
  }

  getCityStatistics(): Observable<CityStats> {
    return this._http.get<CityStats>(`${this._BASE_URL}/admin/statistics/by-city`);
  }

  getSaloonsStatisticsByCity(): Observable<SaloonsByCityStats> {
    return this._http.get<SaloonsByCityStats>(`${this._BASE_URL}/admin/statistics/saloons-by-city`);
  }

  getUserCityStats(): Observable<UserCityStats> {
    return this._http.get<UserCityStats>(`${this._BASE_URL}/admin/statistics/users-by-city`);
  }

  getSaloonUsers(saloonId: number): Observable<User[]> {
    return this._http.get<User[]>(`${this._BASE_URL}/admin/saloon/${saloonId}/users`);
  }

  // Legacy method - kept for compatibility
  getAllUsers(): Observable<User[]> {
    return this._http.get<User[]>(`${this._BASE_URL}/profile`);
  }

  // New paginated method for users
  getUsersPaginated(params: PaginationParams): Observable<PagedResponse<User>> {
    let httpParams = new HttpParams()
      .set('page', params.page.toString())
      .set('size', params.size.toString())
      .set('sortBy', params.sortBy)
      .set('sortDir', params.sortDir);

    if (params.search) {
      httpParams = httpParams.set('search', params.search);
    }

    return this._http.get<PagedResponse<User>>(`${this._BASE_URL}/admin/users`, {
      params: httpParams,
    });
  }

  // Legacy method - kept for compatibility
  getAllSaloons(): Observable<Saloon[]> {
    // Use page=-1 to get all saloons without pagination
    return this._http.get<Saloon[]>(`${this._BASE_URL}/admin/saloons?page=-1`);
  }

  // New paginated method for saloons
  getSaloonsPaginated(params: PaginationParams): Observable<PagedResponse<Saloon>> {
    let httpParams = new HttpParams()
      .set('page', params.page.toString())
      .set('size', params.size.toString())
      .set('sortBy', params.sortBy)
      .set('sortDir', params.sortDir);

    if (params.search) {
      httpParams = httpParams.set('search', params.search);
    }

    return this._http.get<PagedResponse<Saloon>>(`${this._BASE_URL}/admin/saloons`, {
      params: httpParams,
    });
  }

  createSaloon(saloon: CreateSaloonRequest): Observable<Saloon> {
    return this._http.post<Saloon>(`${this._BASE_URL}/admin/saloon`, saloon);
  }

  createSaloonWithImage(formData: FormData): Observable<Saloon> {
    return this._http.post<Saloon>(`${this._BASE_URL}/admin/saloon/upload`, formData);
  }

  updateSaloon(id: number, saloon: CreateSaloonRequest): Observable<Saloon> {
    return this._http.put<Saloon>(`${this._BASE_URL}/admin/saloon/${id}`, saloon);
  }

  updateSaloonWithImage(id: number, formData: FormData): Observable<Saloon> {
    return this._http.put<Saloon>(`${this._BASE_URL}/admin/saloon/${id}/upload`, formData);
  }

  getSaloonById(id: number): Observable<Saloon> {
    return this._http.get<Saloon>(`${this._BASE_URL}/admin/saloon/${id}`);
  }

  toggleSaloonActive(id: number): Observable<Saloon> {
    return this._http.patch<Saloon>(`${this._BASE_URL}/admin/saloon/${id}/toggle-active`, {});
  }

  toggleSaloonPrivate(id: number): Observable<Saloon> {
    return this._http.patch<Saloon>(`${this._BASE_URL}/admin/saloon/${id}/toggle-private`, {});
  }

  deleteSaloon(id: number): Observable<void> {
    return this._http.delete<void>(`${this._BASE_URL}/admin/saloon/${id}`);
  }

  deleteUser(id: number): Observable<void> {
    return this._http.delete<void>(`${this._BASE_URL}/admin/user/${id}`);
  }

  toggleUserPremium(id: number): Observable<{ id: number; isPremium: boolean }> {
    return this._http.patch<{ id: number; isPremium: boolean }>(
      `${this._BASE_URL}/admin/user/${id}/toggle-premium`,
      {}
    );
  }

  toggleUserActive(id: number): Observable<User> {
    return this._http.patch<User>(`${this._BASE_URL}/admin/user/${id}/toggle-active`, {});
  }

  updateUserRole(id: number, role: string): Observable<User> {
    return this._http.patch<User>(`${this._BASE_URL}/admin/user/${id}/role`, { role });
  }

  // ─── Events ───────────────────────────────────────────────

  getEventsPaginated(params: PaginationParams): Observable<PagedResponse<EventItem>> {
    let httpParams = new HttpParams()
      .set('page', params.page.toString())
      .set('size', params.size.toString())
      .set('sortBy', params.sortBy)
      .set('sortDir', params.sortDir);

    if (params.search) {
      httpParams = httpParams.set('search', params.search);
    }

    return this._http.get<PagedResponse<EventItem>>(`${this._BASE_URL}/admin/events`, {
      params: httpParams,
    });
  }

  getEventById(id: number): Observable<EventItem> {
    return this._http.get<EventItem>(`${this._BASE_URL}/admin/event/${id}`);
  }

  createEventWithImage(formData: FormData): Observable<EventItem> {
    return this._http.post<EventItem>(`${this._BASE_URL}/admin/event/upload`, formData);
  }

  updateEvent(id: number, event: Record<string, unknown>): Observable<EventItem> {
    return this._http.put<EventItem>(`${this._BASE_URL}/admin/event/${id}`, event);
  }

  updateEventWithImage(id: number, formData: FormData): Observable<EventItem> {
    return this._http.put<EventItem>(`${this._BASE_URL}/admin/event/${id}/upload`, formData);
  }

  toggleEventActive(id: number): Observable<EventItem> {
    return this._http.patch<EventItem>(`${this._BASE_URL}/admin/event/${id}/toggle-active`, {});
  }

  deleteEvent(id: number): Observable<void> {
    return this._http.delete<void>(`${this._BASE_URL}/admin/event/${id}`);
  }
}
