import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { map, Observable } from 'rxjs';
import { User } from '../models/user';
import { environment } from 'src/environments/environment.development';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private readonly _BASE_URL_API = environment.apiUrl;
  private _router = inject(Router);
  private _http = inject(HttpClient);

  createUser(registerFormValues: any): Observable<User> {
    return this._http.post<User>(`${this._BASE_URL_API}/auth/register`, registerFormValues).pipe(
      map((data: User) => {
        this._router.navigate(['/login']);
        return data;
      })
    );
  }

  getListUser(): Observable<User[]> {
    const token = localStorage.getItem('token');

    const headers = {
      Authorization: `Bearer ${token}`,
    };
    return this._http.get<User[]>(this._BASE_URL_API + '/profile', { headers });
  }
}
