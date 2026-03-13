import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { UserStoreService } from '../../user/store/user-store.service';
import { environment } from 'src/environments/environment';
import { jwtDecode } from 'jwt-decode';
import { UserDTO } from '../../user/models/userDTO';

@Injectable({
  providedIn: 'root',
})
export class AuthApiService {
  private _router = inject(Router);
  private _http: HttpClient = inject(HttpClient);
  private _userStore = inject(UserStoreService);

  private readonly _BASE_URL_API = environment.apiUrl;

  public register$(email: string, password: string): Observable<boolean> {
    return this._http.post<boolean>(`${this._BASE_URL_API}/auth/register`, { email, password });
  }

  public login$(email: string, password: string): Observable<UserDTO> {
    return this._http.post<UserDTO>(`${this._BASE_URL_API}/auth/login`, { email, password }).pipe(
      tap((user: UserDTO) => {
        this.saveToken(user.token);
        localStorage.setItem('user', JSON.stringify(user));
        // Synchroniser avec UserStoreService
        this._userStore.setUserConnected(user);
      })
    );
  }

  public saveToken(token: string): void {
    localStorage.setItem('saloon_auth_token', token);
  }

  public getToken(): string {
    if (localStorage.getItem('saloon_auth_token')) {
      return localStorage.getItem('saloon_auth_token') as string;
    }
    throw new Error('Token not found');
  }

  public clearToken(): void {
    localStorage.removeItem('saloon_auth_token');
  }

  isLoggedIn(): boolean {
    const token = this.getToken();
    if (!token) return false;
    const decodedToken: any = jwtDecode(token);
    const expiryDate = new Date(decodedToken.exp * 1000);
    if (expiryDate < new Date()) {
      this.clearToken();
      return false;
    }
    return true;
  }

  isLoggedInSimplified(): boolean {
    if (localStorage.getItem('saloon_auth_token')) {
      return true;
    }
    return false;
  }

  getDecodedToken(): any {
    const token = this.getToken();
    if (!token) return null;
    return jwtDecode(token);
  }

  public getUserRoles(): string[] {
    const decodedToken = this.getDecodedToken();
    if (decodedToken && decodedToken.roles && Array.isArray(decodedToken.roles)) {
      return decodedToken.roles.map((roleObj: any) => roleObj.authority);
    }
    return [];
  }

  public getUserRole(): string | null {
    const roles = this.getUserRoles();
    return roles.length > 0 ? roles[0] : null;
  }

  public logout(): void {
    localStorage.removeItem('saloon_auth_token');
    localStorage.removeItem('user');
    // Réinitialiser UserStoreService
    this._userStore.setUserConnected({
      id: 0,
      email: '',
      role: '',
      token: '',
      imgUrl: '',
      firstName: '',
      lastName: '',
      userName: '',
      description: '',
      age: 0,
    } as UserDTO);
    this._router.navigate(['/']);
  }
}
