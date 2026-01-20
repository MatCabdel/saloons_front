import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Saloon } from '../../saloon/models/saloonModel';
import { User } from '../../user/models/user';

export type DashboardStats = {
  totalUsers: number;
  activeUsers: number;
  premiumUsers: number;
  totalSaloons: number;
  saloonsByCity: Record<string, number>;
  connectedUsers: number;
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
};

export type SaloonsByCityStats = {
  saloonCountByCity: Record<string, number>;
  saloonsByCity: Record<string, SaloonStatsItem[]>;
};

export type CreateSaloonRequest = {
  name: string;
  imgUrl: string;
  address?: string;
  city?: string;
  country?: string;
  latitude: number;
  longitude: number;
  radiusMeters?: number;
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
    return this._http.get<PremiumMonthlyStats[]>(`${this._BASE_URL}/admin/statistics/premium-evolution`);
  }

  getCityStatistics(): Observable<CityStats> {
    return this._http.get<CityStats>(`${this._BASE_URL}/admin/statistics/by-city`);
  }

  getSaloonsStatisticsByCity(): Observable<SaloonsByCityStats> {
    return this._http.get<SaloonsByCityStats>(`${this._BASE_URL}/admin/statistics/saloons-by-city`);
  }

  getSaloonUsers(saloonId: number): Observable<User[]> {
    return this._http.get<User[]>(`${this._BASE_URL}/admin/saloon/${saloonId}/users`);
  }

  getAllUsers(): Observable<User[]> {
    return this._http.get<User[]>(`${this._BASE_URL}/profile`);
  }

  getAllSaloons(): Observable<Saloon[]> {
    // Utiliser l'endpoint admin pour récupérer TOUS les saloons (actifs et inactifs)
    return this._http.get<Saloon[]>(`${this._BASE_URL}/admin/saloons`);
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

  toggleSaloonActive(id: number): Observable<Saloon> {
    return this._http.patch<Saloon>(`${this._BASE_URL}/admin/saloon/${id}/toggle-active`, {});
  }

  deleteSaloon(id: number): Observable<void> {
    return this._http.delete<void>(`${this._BASE_URL}/admin/saloon/${id}`);
  }

  deleteUser(id: number): Observable<void> {
    return this._http.delete<void>(`${this._BASE_URL}/admin/user/${id}`);
  }
}
