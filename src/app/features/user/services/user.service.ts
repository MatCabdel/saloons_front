import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { UserStoreService } from '../store/user-store.service';
import { map, Observable } from 'rxjs';
import { User } from '../models/user';
import { environment } from 'src/environments/environment.development';
// import { Admin } from '../models/admin';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private readonly _BASE_URL_API = environment.apiUrl;
  private _router = inject(Router);
  private _http = inject(HttpClient);
  private _userStore = inject(UserStoreService);

  createUser(registerFormValues: any): Observable<User> {
    return this._http.post<User>(`${this._BASE_URL_API}/auth/register`, registerFormValues).pipe(
      map((data: User) => {
        console.log("✅ Réponse de l'API :", data);
        this._router.navigate(['/login']);
        return data;
      })
    );
  }

  /*
  createAdmin(registerFormValues: any): Observable<Admin> {
    return this.http
      .post<Admin>(
        `${this.BASE_URL_API}/auth/register/mentor`,
        registerFormValues
      )
  } */
}
