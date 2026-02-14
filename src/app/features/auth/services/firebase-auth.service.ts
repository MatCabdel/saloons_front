import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal, NgZone } from '@angular/core';
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
import { Observable, from, tap, switchMap, map, catchError, throwError, EMPTY } from 'rxjs';
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
  private _ngZone = inject(NgZone);
  private readonly _BASE_URL = environment.apiUrl;

  /** Timeout for signInWithPopup on native platforms (ms) */
  private readonly _POPUP_TIMEOUT_MS = 15_000;

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
   * Sign in with Google.
   *
   * On WEB: signInWithPopup works (same browsing context).
   * On iOS WKWebView: signInWithPopup HANGS because window.open() is blocked
   * silently by WKWebView — the Promise never resolves nor rejects.
   *
   * Strategy for native:
   *  1. Try signInWithPopup with a 15s timeout
   *  2. If it times out (expected on iOS), fall back to signInWithRedirect
   *  3. signInWithRedirect navigates away; on app resume _handleRedirectResult()
   *     picks up the result
   */
  signInWithGoogle(): Observable<AuthResponse> {
    const platform = this._isNativePlatform() ? 'native' : 'web';
    console.log(`[FirebaseAuth][G1] signInWithGoogle() called — platform=${platform}`);
    this.isLoading.set(true);

    const provider = new GoogleAuthProvider();

    // On native iOS, go straight to redirect (popup is blocked by WKWebView)
    if (this._isNativePlatform()) {
      console.log('[FirebaseAuth][G2] Native detected → using signInWithRedirect');
      return from(signInWithRedirect(this._auth, provider)).pipe(
        // signInWithRedirect navigates away, so this observable won't emit.
        // The result is handled by _handleRedirectResult() on app resume.
        switchMap(() => EMPTY as Observable<AuthResponse>),
        catchError(error => {
          console.error('[FirebaseAuth][G3] signInWithRedirect error:', error?.code, error?.message);
          this.isLoading.set(false);
          return throwError(() => error);
        })
      );
    }

    // Web: signInWithPopup works normally
    console.log('[FirebaseAuth][G2] Web → using signInWithPopup');
    return from(signInWithPopup(this._auth, provider)).pipe(
      tap(result => {
        console.log('[FirebaseAuth][G4] signInWithPopup resolved — uid:', result.user?.uid, 'email:', result.user?.email);
      }),
      switchMap(result => this._authenticateWithBackend(result.user)),
      tap(response => this._handleAuthResponse(response)),
      tap(() => this.isLoading.set(false)),
      catchError(error => {
        console.error('[FirebaseAuth][G5] signInWithPopup error:', error?.code, error?.message);
        this.isLoading.set(false);
        return throwError(() => error);
      })
    );
  }

  /**
   * Sign in with Facebook.
   * Same strategy as Google: redirect on native, popup on web.
   */
  signInWithFacebook(): Observable<AuthResponse> {
    const platform = this._isNativePlatform() ? 'native' : 'web';
    console.log(`[FirebaseAuth][F1] signInWithFacebook() called — platform=${platform}`);
    this.isLoading.set(true);

    const provider = new FacebookAuthProvider();

    if (this._isNativePlatform()) {
      console.log('[FirebaseAuth][F2] Native detected → using signInWithRedirect');
      return from(signInWithRedirect(this._auth, provider)).pipe(
        switchMap(() => EMPTY as Observable<AuthResponse>),
        catchError(error => {
          console.error('[FirebaseAuth][F3] signInWithRedirect error:', error?.code, error?.message);
          this.isLoading.set(false);
          return throwError(() => error);
        })
      );
    }

    console.log('[FirebaseAuth][F2] Web → using signInWithPopup');
    return from(signInWithPopup(this._auth, provider)).pipe(
      tap(result => {
        console.log('[FirebaseAuth][F4] signInWithPopup resolved — uid:', result.user?.uid, 'email:', result.user?.email);
      }),
      switchMap(result => this._authenticateWithBackend(result.user)),
      tap(response => this._handleAuthResponse(response)),
      tap(() => this.isLoading.set(false)),
      catchError(error => {
        console.error('[FirebaseAuth][F5] signInWithPopup error:', error?.code, error?.message);
        this.isLoading.set(false);
        return throwError(() => error);
      })
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
   * Send Firebase token to backend for authentication.
   * The backend expects: { "firebaseToken": "<Firebase ID token>" }
   */
  private _authenticateWithBackend(firebaseUser: FirebaseUser): Observable<AuthResponse> {
    console.log('[FirebaseAuth][B1] _authenticateWithBackend — uid:', firebaseUser?.uid, 'email:', firebaseUser?.email);

    return from(firebaseUser.getIdToken()).pipe(
      tap(token => {
        const len = token?.length ?? 0;
        const prefix = token?.substring(0, 10) ?? '<null>';
        const isJwt = token?.startsWith('eyJ') ?? false;
        console.log(`[FirebaseAuth][B2] getIdToken() → length=${len}, startsWithEyJ=${isJwt}, prefix=${prefix}...`);
      }),
      switchMap(firebaseToken => {
        const payload = { firebaseToken };
        console.log('[FirebaseAuth][B3] POST /auth/firebase — payload keys:', Object.keys(payload), 'token length:', firebaseToken?.length);
        return this._http.post<AuthResponse>(`${this._BASE_URL}/auth/firebase`, payload);
      }),
      tap(response =>
        console.log('[FirebaseAuth][B4] Backend response OK — email:', response?.user?.email, 'newUser:', response?.newUser)
      ),
      catchError(error => {
        console.error('[FirebaseAuth][B5] Backend error — status:', error?.status, 'body:', JSON.stringify(error?.error));
        return throwError(() => error);
      })
    );
  }

  private _isNativePlatform(): boolean {
    return Capacitor.isNativePlatform();
  }

  /**
   * On native platforms, after signInWithRedirect completes and the app resumes,
   * getRedirectResult() returns the OAuth credential.
   *
   * IMPORTANT: For this to work on Capacitor iOS:
   *  - iosScheme must be 'https' in capacitor.config.ts (so origin = https://localhost)
   *  - server.hostname should NOT be set (defaults to 'localhost')
   *  - The Firebase JS SDK stores the pending redirect in indexedDB keyed by origin
   *  - When the WKWebView reloads after redirect, same origin → same indexedDB → result found
   */
  private _handleRedirectResult(): void {
    if (!this._isNativePlatform()) {
      console.log('[FirebaseAuth][R0] Web platform — skipping redirect result check');
      return;
    }

    console.log('[FirebaseAuth][R1] Native platform — checking getRedirectResult()...');

    from(getRedirectResult(this._auth)).subscribe({
      next: result => {
        if (!result?.user) {
          console.log('[FirebaseAuth][R2] getRedirectResult → null (no pending redirect)');
          this.isLoading.set(false);
          return;
        }

        console.log('[FirebaseAuth][R3] getRedirectResult → user found!', 'uid:', result.user.uid, 'email:', result.user.email);
        this.isLoading.set(true);

        // Run inside NgZone so Angular detects the async state changes
        this._ngZone.run(() => {
          this._authenticateWithBackend(result.user).subscribe({
            next: response => {
              console.log('[FirebaseAuth][R4] Backend auth OK after redirect');
              this._handleAuthResponse(response);
              this.isLoading.set(false);

              // Navigate based on user state
              if (response.newUser || response.user.profileStatus === 'PROFILE_INCOMPLETE') {
                this._router.navigate(['/onboarding']);
              } else if (response.user.role === 'ROLE_ADMIN') {
                this._router.navigate(['/dashboard']);
              } else {
                this._router.navigate(['/map']);
              }
            },
            error: error => {
              console.error('[FirebaseAuth][R5] Backend auth error after redirect:', error?.status, error?.error);
              this.isLoading.set(false);
            },
          });
        });
      },
      error: error => {
        console.error('[FirebaseAuth][R6] getRedirectResult error:', error?.code, error?.message);
        this.isLoading.set(false);
      },
    });
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
