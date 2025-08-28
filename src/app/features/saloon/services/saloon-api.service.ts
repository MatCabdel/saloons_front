import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Saloon } from '../models/saloonModel';
import { environment } from '../../../../environments/environment.development';
import { Observable } from 'rxjs';
import { User } from '../../user/models/user';

@Injectable({
  providedIn: 'root',
})
export class SaloonApiService {
  private _http = inject(HttpClient);
  private readonly _BASE_URL_API = environment.apiUrl;

  getListSaloon(): Observable<Saloon[]> {
    return this._http.get<Saloon[]>(this._BASE_URL_API + '/saloon');
  }

  getSaloonById(id: string): Observable<Saloon> {
    return this._http.get<Saloon>(`${this._BASE_URL_API}/saloon/${id}`);
  }

  getUsersInSaloon(saloonId: string): Observable<User[]> {
    return this._http.get<User[]>(`${this._BASE_URL_API}/saloon/${saloonId}/users`);
  }
}
