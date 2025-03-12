import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthApiService {
  private _http: HttpClient = inject(HttpClient);

  public register$(email: string, password: string): Observable<boolean> {
    return this._http.post<boolean>('/api/auth/register', { email, password });
  }
}
