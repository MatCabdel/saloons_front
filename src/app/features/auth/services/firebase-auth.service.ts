import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import {
  Auth,
  signInWithPopup,
  GoogleAuthProvider,
  FacebookAuthProvider,
  signOut,
  User as FirebaseUser,
} from '@angular/fire/auth';
import { Capacitor } from '@capacitor/core';
import { Router } from '@angular/router';
import { Observable, from, tap, switchMap, map, catchError, throwError } from 'rxjs';
import { environment } from 'src/environments/environment';
import { UserStoreService } from '../../user/store/user-store.service';
import { SocialLogin } from '@capgo/capacitor-social-login';
import { PushNotificationService } from '../../../core/services/push-notification.service';

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
  private _pushService = inject(PushNotificationService);
  private readonly _BASE_URL = environment.apiUrl;

  currentUser = signal<UserDTO | null>(null);
  isLoading = signal(false);
  private _nativeGoogleInitialized = false;

  constructor() {
    this._loadUserFromStorage();
    this._initNativeGoogleIfNeeded();
  }

  private _loadUserFromStorage(): void {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        this.currentUser.set(user);
        // Synchroniser avec UserStoreService
        this._userStore.setUserConnected(user);

        // Si l'utilisateur est déjà connecté, initialiser les push notifications
        if (localStorage.getItem('saloon_auth_token')) {
          this._pushService.initialize().catch(err => {
            console.error('Failed to initialize push notifications on startup:', err);
          });
        }
      } catch {
        localStorage.removeItem('user');
      }
    }
  }

  /**
   * Initialize the native Google sign-in plugin (only on Capacitor iOS/Android).
   * Must be called once before SocialLogin.login().
   */
  private async _initNativeGoogleIfNeeded(): Promise<void> {
    if (!this._isNativePlatform() || this._nativeGoogleInitialized) {
      return;
    }
    try {
      console.log('[FirebaseAuth][INIT] Initializing SocialLogin for native Google...');
      await SocialLogin.initialize({
        google: {
          iOSClientId: environment.google.iOSClientId,
          iOSServerClientId: environment.google.webClientId,
          webClientId: environment.google.webClientId,
          mode: 'online',
        },
      });
      this._nativeGoogleInitialized = true;
      console.log('[FirebaseAuth][INIT] SocialLogin initialized ✅');
    } catch (err) {
      console.error('[FirebaseAuth][INIT] SocialLogin.initialize() failed:', err);
    }
  }

  /**
   * Sign in with Google.
   *
   * On WEB: signInWithPopup (works in same browsing context).
   * On NATIVE (iOS / Android): @capgo/capacitor-social-login opens the native
   * Google sign-in sheet, returns a Google ID token, then we exchange it for a
   * Firebase credential via signInWithCredential → getIdToken → POST backend.
   */
  signInWithGoogle(): Observable<AuthResponse> {
    const platform = this._isNativePlatform() ? 'native' : 'web';
    console.log(`[FirebaseAuth][G1] signInWithGoogle() called — platform=${platform}`);
    this.isLoading.set(true);

    if (this._isNativePlatform()) {
      return this._signInWithGoogleNative();
    }

    // Web: signInWithPopup works normally
    console.log('[FirebaseAuth][G2] Web → using signInWithPopup');
    const provider = new GoogleAuthProvider();
    return from(signInWithPopup(this._auth, provider)).pipe(
      tap(result => {
        console.log(
          '[FirebaseAuth][G4] signInWithPopup resolved — uid:',
          result.user?.uid,
          'email:',
          result.user?.email
        );
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
   * Native Google sign-in via @capgo/capacitor-social-login.
   *
   * signInWithCredential() from Firebase JS SDK hangs on capacitor:// origins
   * because the SDK cannot complete its internal network calls from WKWebView.
   *
   * Workaround: use Firebase Auth REST API (identitytoolkit) directly:
   *  1. SocialLogin.login() → native Google sheet → Google ID token
   *  2. POST to Firebase REST verifyAssertion → Firebase ID token
   *  3. POST Firebase ID token to our backend /auth/firebase
   */
  private _signInWithGoogleNative(): Observable<AuthResponse> {
    console.log('[FirebaseAuth][G2] Native → using SocialLogin plugin');

    const nativeLogin = async (): Promise<string> => {
      await this._initNativeGoogleIfNeeded();

      console.log('[FirebaseAuth][G3] Calling SocialLogin.login({ provider: "google" })...');
      const result = await SocialLogin.login({
        provider: 'google',
        options: {
          scopes: ['email', 'profile'],
        },
      });

      console.log('[FirebaseAuth][G4] SocialLogin.login() OK');

      const googleIdToken = (result?.result as any)?.idToken;
      if (!googleIdToken) {
        throw new Error('No idToken returned from native Google sign-in');
      }

      console.log(
        `[FirebaseAuth][G5] Got Google idToken (length=${googleIdToken.length}), calling Firebase REST API...`
      );

      // Use Firebase Auth REST API to exchange Google ID token for Firebase ID token
      // This avoids signInWithCredential() which hangs on capacitor:// in WKWebView
      const firebaseApiKey = environment.firebase.apiKey;
      const url = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithIdp?key=${firebaseApiKey}`;

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postBody: `id_token=${googleIdToken}&providerId=google.com`,
          requestUri: 'https://localhost',
          returnIdpCredential: true,
          returnSecureToken: true,
        }),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        console.error('[FirebaseAuth][G6] Firebase REST API error:', response.status, errorBody);
        throw new Error(`Firebase REST signInWithIdp failed: ${response.status} ${errorBody}`);
      }

      const data = await response.json();
      const firebaseIdToken = data.idToken;

      if (!firebaseIdToken) {
        console.error('[FirebaseAuth][G6] No idToken in Firebase REST response:', data);
        throw new Error('No Firebase ID token in REST response');
      }

      console.log(
        `[FirebaseAuth][G6] Firebase REST API OK — got Firebase idToken (length=${firebaseIdToken.length}), email=${data.email}`
      );

      return firebaseIdToken;
    };

    return from(nativeLogin()).pipe(
      switchMap(firebaseIdToken => {
        // Send Firebase ID token directly to our backend
        const payload = { firebaseToken: firebaseIdToken };
        console.log('[FirebaseAuth][G7] POST /auth/firebase — token length:', firebaseIdToken.length);
        return this._http.post<AuthResponse>(`${this._BASE_URL}/auth/firebase`, payload);
      }),
      tap(response => {
        console.log('[FirebaseAuth][G8] Backend response OK — email:', response?.user?.email);
        this._handleAuthResponse(response);
      }),
      tap(() => this.isLoading.set(false)),
      catchError(error => {
        console.error(
          '[FirebaseAuth][G9] Native Google sign-in error:',
          error?.code || error?.message || error
        );
        this.isLoading.set(false);
        return throwError(() => error);
      })
    );
  }

  /**
   * Sign in with Facebook.
   * On web: signInWithPopup. On native: not yet implemented with SocialLogin plugin.
   */
  signInWithFacebook(): Observable<AuthResponse> {
    const platform = this._isNativePlatform() ? 'native' : 'web';
    console.log(`[FirebaseAuth][F1] signInWithFacebook() called — platform=${platform}`);
    this.isLoading.set(true);

    const provider = new FacebookAuthProvider();

    console.log('[FirebaseAuth][F2] Using signInWithPopup');
    return from(signInWithPopup(this._auth, provider)).pipe(
      tap(result => {
        console.log(
          '[FirebaseAuth][F4] signInWithPopup resolved — uid:',
          result.user?.uid,
          'email:',
          result.user?.email
        );
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
    console.log(
      '[FirebaseAuth][B1] _authenticateWithBackend — uid:',
      firebaseUser?.uid,
      'email:',
      firebaseUser?.email
    );

    return from(firebaseUser.getIdToken()).pipe(
      tap(token => {
        const len = token?.length ?? 0;
        const prefix = token?.substring(0, 10) ?? '<null>';
        const isJwt = token?.startsWith('eyJ') ?? false;
        console.log(
          `[FirebaseAuth][B2] getIdToken() → length=${len}, startsWithEyJ=${isJwt}, prefix=${prefix}...`
        );
      }),
      switchMap(firebaseToken => {
        const payload = { firebaseToken };
        console.log(
          '[FirebaseAuth][B3] POST /auth/firebase — payload keys:',
          Object.keys(payload),
          'token length:',
          firebaseToken?.length
        );
        return this._http.post<AuthResponse>(`${this._BASE_URL}/auth/firebase`, payload);
      }),
      tap(response =>
        console.log(
          '[FirebaseAuth][B4] Backend response OK — email:',
          response?.user?.email,
          'newUser:',
          response?.newUser
        )
      ),
      catchError(error => {
        console.error(
          '[FirebaseAuth][B5] Backend error — status:',
          error?.status,
          'body:',
          JSON.stringify(error?.error)
        );
        return throwError(() => error);
      })
    );
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

    // Initialiser les push notifications après connexion
    this._pushService.initialize().catch(err => {
      console.error('Failed to initialize push notifications:', err);
    });
  }

  /**
   * Sign out from Firebase and clear local storage
   */
  signOut(): Observable<void> {
    // D'abord désenregistrer le token push (avant de supprimer le JWT)
    this._pushService.unregisterToken().catch(err => {
      console.error('Failed to unregister push token:', err);
    });

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
