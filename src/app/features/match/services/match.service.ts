import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment.development';

@Injectable({
  providedIn: 'root',
})
export class MatchService {
  private _BASE_URL_API = environment.apiUrl;
  private _http = inject(HttpClient);

  createLike(userId1: number, userId2: number): Observable<{ message: string }> {
    return this._http.post<{ message: string }>(`${this._BASE_URL_API}/match/${userId1}/like/${userId2}`, {});
  }
}
