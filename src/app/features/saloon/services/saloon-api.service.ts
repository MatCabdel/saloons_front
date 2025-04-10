import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Saloon } from '../models/saloonModel';
import { environment } from 'src/environments/environment.development';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SaloonApiService {

  private _http = inject(HttpClient);

  private readonly _BASE_URL_API = environment.apiUrl;

  getListSaloon(): Observable<Saloon[]>{
    const token = localStorage.getItem('token');
  
    const headers = {
      Authorization: `Bearer ${token}`
    };
    return this._http.get<Saloon[]>(this._BASE_URL_API + '/saloon', { headers })
  }

}
