import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { UserStoreService } from '../../user/store/user-store.service';
import { environment } from 'src/environments/environment.development';
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
      })
    );
  }

  public saveToken(token: string): void {
    localStorage.setItem('token', token);
  }

  public getToken(): string {
    if (localStorage.getItem('token')) {
      return localStorage.getItem('token') as string;
    }
    throw new Error('Token not found');
  }

  public clearToken(): void {
    localStorage.removeItem('token');
  }

  // "Vraie" méthode pour se connecter
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

  // Méthode simplifiée pour cet atelier :
  isLoggedInSimplified(): boolean {
    if (localStorage.getItem('token')) {
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
    // "roles" est un tableau d'objets { authority: string }
    if (decodedToken && decodedToken.roles && Array.isArray(decodedToken.roles)) {
      // On mappe chaque objet { authority: "ROLE_USER" } en simple string "ROLE_USER"
      return decodedToken.roles.map((roleObj: any) => roleObj.authority);
    }
    return [];
  }

  public getUserRole(): string | null {
    const roles = this.getUserRoles();
    return roles.length > 0 ? roles[0] : null;
  }
}
