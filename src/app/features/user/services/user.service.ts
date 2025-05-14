import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, map, Observable, of, tap } from 'rxjs';
import { User } from '../models/user';
import { environment } from 'src/environments/environment.development';
import { UserDTO } from '../models/userDTO';
import { UserStoreService } from '../store/user-store.service';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private readonly _BASE_URL_API = environment.apiUrl;
  private _router = inject(Router);
  private _http = inject(HttpClient);
  userConnected = inject(UserStoreService).getUserConnected$();
  isLoading$ = new BehaviorSubject<boolean>(false);

  activeUserProfil$: BehaviorSubject<UserDTO> = new BehaviorSubject<UserDTO>({} as UserDTO);

  createUser(registerFormValues: FormData): Observable<UserDTO> {
    return this._http.post<UserDTO>(`${this._BASE_URL_API}/auth/register`, registerFormValues).pipe(
      map((data: UserDTO) => {
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

  getUserById(id: number): Observable<User> {
    return this._http.get<User>(`${this._BASE_URL_API}/profile/profile/${id}`);
  }

  updateUserImage(file: File): Observable<UserDTO | void> {
    // sortie rapide si pas de fichier (plus d'else après le return)
    if (!file) {
      return of();
    }

    this.isLoading$.next(true);
    const formData = new FormData();
    formData.append('file', file);

    const headers = new HttpHeaders();
    const url = `${this._BASE_URL_API}/user/upload/image/${this.userConnected.value.id}`;

    return this._http.post<UserDTO>(url, formData, { headers }).pipe(
      tap((res): void => {
        this.activeUserProfil$.next(res);
        this.isLoading$.next(false);
      })
    );
  }

  connectUserToSaloon(userId: number, saloonId: number): Observable<UserDTO> {
    const token = localStorage.getItem('token');
    const headers = { Authorization: `Bearer ${token}` };
    return this._http.patch<UserDTO>(`${this._BASE_URL_API}/profile/${userId}/connect-saloon/${saloonId}`, {}, { headers });
  }

  disconnectUserFromSaloon(userId: number): Observable<UserDTO> {
    const token = localStorage.getItem('token');
    const headers = { Authorization: `Bearer ${token}` };
    return this._http.patch<UserDTO>(`${this._BASE_URL_API}/profile/${userId}/disconnect-saloon`, {}, { headers });
  }
}
