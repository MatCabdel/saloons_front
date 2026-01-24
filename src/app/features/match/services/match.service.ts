import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { MatchUser } from '../models/match-user';

@Injectable({
  providedIn: 'root',
})
export class MatchService {
  private _BASE_URL_API = environment.apiUrl;
  private _http = inject(HttpClient);

  createLike(userId1: number, userId2: number): Observable<{ message: string }> {
    return this._http.post<{ message: string }>(`${this._BASE_URL_API}/match/${userId1}/like/${userId2}`, {});
  }

  hasLiked(userId1: number, userId2: number): Observable<{ hasLiked: boolean }> {
    return this._http.get<{ hasLiked: boolean }>(`${this._BASE_URL_API}/match/${userId1}/has-liked/${userId2}`);
  }

  getMatches(): Observable<MatchUser[]> {
    return this._http.get<MatchUser[]>(`${this._BASE_URL_API}/match/matches`);
  }
}
