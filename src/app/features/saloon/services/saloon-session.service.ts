import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { SaloonSessionDTO } from '../models/saloonSessionDTO';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class SaloonSessionService {
  private _BASE_URL_API = environment.apiUrl;
  private _http = inject(HttpClient);

  getSession(userId: number): Observable<SaloonSessionDTO> {
    return this._http.get<SaloonSessionDTO>(`${this._BASE_URL_API}/session/${userId}`);
  }
}
