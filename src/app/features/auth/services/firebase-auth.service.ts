import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import {
  Auth,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider,
  FacebookAuthProvider,
  signOut,
  User as FirebaseUser,
} from '@angular/fire/auth';
import { Capacitor } from '@capacitor/core';
import { Router } from '@angular/router';
import { EMPTY, Observable, from, tap, switchMap, map, catchError, throwError } from 'rxjs';
import { environment } from 'src/environments/environment';
import { UserStoreService } from '../../user/store/user-store.service';

export type ProfileStatus = 'PROFILE_INCOMPLETE' | 'ACTIVE';
export type AuthProvider = 'EMAIL' | 'GOOGLE' | 'FACEBOOK';

export type UserDTO = {
  id: number;
  email: string;
  userName: string | null;
  imgUrl: string | null;
  age: number;
  city: string | null;
  description: string | null;
  profileStatus: ProfileStatus;
  authProvider: AuthProvider;
  firstname: string | null;
  lastname: string | null;
  isPremium: boolean;
  birthDate: string | null;
  role: string | null;
};

export type AuthResponse = {
  user: UserDTO;
  token: string;
  newUser: boolean;
};

export type EmailRegisterRequest = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
};

@Injectable({
  providedIn: 'root',
})
export class FirebaseAuthService {
  private _auth = inject(Auth);
  private _http = inject(HttpClient);
  private _router = inject(Router);
  private _userStore = inject(UserStoreService);
  private readonly _BASE_URL = environment.apiUrl;

  currentUser = signal<UserDTO | null>(null);
  isLoading = signal(false);

  constructor() {
    this._loadUserFromStorage();
    this._handleRedirectResult();
  }

  private _loadUserFromStorage(): void {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        this.currentUser.set(user);
        // Synchroniser avec UserStoreService
        this._userStore.setUserConnected(user);
      } catch {
        localStorage.removeItem('user');
      }
    }
  }

  /**
   * Sign in with Google
   */
  signInWithGoogle(): Observable<AuthResponse> {
    this.isLoading.set(true);
    const provider = new GoogleAuthProvider();

    if (this._isNativePlatform()) {
      return from(signInWithRedirect(this._auth, provider)).pipe(
        switchMap(() => EMPTY as Observable<AuthResponse>),
        catchError(error => {
          this.isLoading.set(false);
          return throwError(() => error);
        })
      );
    }

    return from(signInWithPopup(this._auth, provider)).pipe(
      switchMap(result => this._authenticateWithBackend(result.user)),
      tap(response => this._handleAuthResponse(response)),
      tap(() => this.isLoading.set(false))
    );
  }

  /**
   * Sign in with Facebook
   */
  signInWithFacebook(): Observable<AuthResponse> {
    this.isLoading.set(true);
    const provider = new FacebookAuthProvider();

    if (this._isNativePlatform()) {
      return from(signInWithRedirect(this._auth, provider)).pipe(
        switchMap(() => EMPTY as Observable<AuthResponse>),
        catchError(error => {
          this.isLoading.set(false);
          return throwError(() => error);
        })
      );
    }

    return from(signInWithPopup(this._auth, provider)).pipe(
      switchMap(result => this._authenticateWithBackend(result.user)),
      tap(response => this._handleAuthResponse(response)),
      tap(() => this.isLoading.set(false))
    );
  }

  /**
   * Register with email and password
   */
  registerWithEmail(request: EmailRegisterRequest): Observable<AuthResponse> {
    this.isLoading.set(true);

    return this._http.post<AuthResponse>(`${this._BASE_URL}/auth/register-email`, request).pipe(
      tap(response => this._handleAuthResponse(response)),
      tap(() => this.isLoading.set(false))
    );
  }

  /**
   * Login with email and password (compatible with existing backend)
   */
  loginWithEmail(email: string, password: string): Observable<AuthResponse> {
    this.isLoading.set(true);

    // L'ancien endpoint retourne un UserDTO avec le token dedans
    return this._http
      .post<UserDTO & { token: string }>(`${this._BASE_URL}/auth/login`, { email, password })
      .pipe(
        tap(response => {
          // Construire un AuthResponse à partir de l'ancien format
          const authResponse: AuthResponse = {
            user: {
              id: response.id,
              email: response.email,
              userName: response.userName,
              imgUrl: response.imgUrl,
              age: response.age,
              city: response.city,
              description: response.description,
              profileStatus: response.profileStatus || 'ACTIVE',
              authProvider: response.authProvider || 'EMAIL',
              firstname: response.firstname,
              lastname: response.lastname,
              isPremium: response.isPremium,
              birthDate: response.birthDate,
              role: response.role,
            },
            token: response.token,
            newUser: false,
          };
          this._handleAuthResponse(authResponse);
        }),
        map(response => ({
          user: {
            id: response.id,
            email: response.email,
            userName: response.userName,
            imgUrl: response.imgUrl,
            age: response.age,
            city: response.city,
            description: response.description,
            profileStatus: (response.profileStatus || 'ACTIVE') as ProfileStatus,
            authProvider: (response.authProvider || 'EMAIL') as AuthProvider,
            firstname: response.firstname,
            lastname: response.lastname,
            isPremium: response.isPremium,
            birthDate: response.birthDate,
            role: response.role,
          },
          token: response.token,
          newUser: false,
        })),
        tap(() => this.isLoading.set(false))
      );
  }

  requestPasswordReset(email: string): Observable<void> {
    return this._http.post<void>(`${this._BASE_URL}/auth/forgot-password`, { email });
  }

  resetPassword(token: string, newPassword: string): Observable<void> {
    return this._http.post<void>(`${this._BASE_URL}/auth/reset-password`, { token, newPassword });
  }

  /**
   * Send Firebase token to backend for authentication
   */
  private _authenticateWithBackend(firebaseUser: FirebaseUser): Observable<AuthResponse> {
    return from(firebaseUser.getIdToken()).pipe(
      switchMap(firebaseToken =>
        this._http.post<AuthResponse>(`${this._BASE_URL}/auth/firebase`, { firebaseToken })
      )
    );
  }

  private _handleRedirectResult(): void {
    if (!this._isNativePlatform()) {
      return;
    }

    from(getRedirectResult(this._auth))
      .pipe(
        switchMap(result => {
          if (!result?.user) {
            return EMPTY;
          }
          this.isLoading.set(true);
          return this._authenticateWithBackend(result.user).pipe(
            tap(response => this._handleAuthResponse(response)),
            tap(() => this.isLoading.set(false))
          );
        })
      )
      .subscribe({
        error: () => {
          this.isLoading.set(false);
        },
      });
  }

  private _isNativePlatform(): boolean {
    return Capacitor.isNativePlatform();
  }

  /**
   * Handle successful authentication response
   */
  private _handleAuthResponse(response: AuthResponse): void {
    this.currentUser.set(response.user);
    // Synchroniser avec UserStoreService
    this._userStore.setUserConnected(response.user as any);
    localStorage.setItem('saloon_auth_token', response.token);
    localStorage.setItem('user', JSON.stringify(response.user));
  }

  /**
   * Sign out from Firebase and clear local storage
   */
  signOut(): Observable<void> {
    return from(signOut(this._auth)).pipe(
      tap(() => {
        this.currentUser.set(null);
        // Réinitialiser UserStoreService avec un utilisateur vide
        this._userStore.setUserConnected({
          id: 0,
          email: '',
          password: '',
          role: '',
          token: '',
          imgUrl: '',
          description: '',
          age: 0,
        } as any);
        localStorage.removeItem('saloon_auth_token');
        localStorage.removeItem('user');
        this._router.navigate(['/']);
      })
    );
  }

  /**
   * Check if user profile is complete
   */
  isProfileComplete(): boolean {
    const user = this.currentUser();
    return user?.profileStatus === 'ACTIVE';
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!localStorage.getItem('saloon_auth_token');
  }

  /**
   * Get current user profile status
   */
  getProfileStatus(): ProfileStatus | null {
    return this.currentUser()?.profileStatus || null;
  }

  /**
   * Update user in local storage after profile completion
   */
  updateCurrentUser(user: UserDTO): void {
    this.currentUser.set(user);
    // Synchroniser avec UserStoreService
    this._userStore.setUserConnected(user as any);
    localStorage.setItem('user', JSON.stringify(user));
  }
}
