import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Saloon, SaloonType } from '../models/saloonModel';
import { SaloonMapItem } from './presence.service';
import { environment } from '../../../../environments/environment';
import { Observable } from 'rxjs';
import { User } from '../../user/models/user';

@Injectable({
  providedIn: 'root',
})
export class SaloonApiService {
  private _http = inject(HttpClient);
  private readonly _BASE_URL_API = environment.apiUrl;

  getListSaloon(type?: SaloonType | null): Observable<Saloon[]> {
    const params = type ? { type } : undefined;
    return this._http.get<Saloon[]>(this._BASE_URL_API + '/saloon', { params });
  }

  getSaloonsForMap(params: {
    minLat: number;
    maxLat: number;
    minLng: number;
    maxLng: number;
    type?: SaloonType | null;
  }): Observable<SaloonMapItem[]> {
    const httpParams: Record<string, string> = {
      minLat: params.minLat.toString(),
      maxLat: params.maxLat.toString(),
      minLng: params.minLng.toString(),
      maxLng: params.maxLng.toString(),
    };
    if (params.type) httpParams['type'] = params.type;
    return this._http.get<SaloonMapItem[]>(this._BASE_URL_API + '/saloon/map', {
      params: httpParams,
    });
  }

  getSaloonById(id: string): Observable<Saloon> {
    return this._http.get<Saloon>(`${this._BASE_URL_API}/saloon/${id}`);
  }

  getUsersInSaloon(saloonId: string): Observable<User[]> {
    return this._http.get<User[]>(`${this._BASE_URL_API}/saloon/${saloonId}/users`);
  }
}
