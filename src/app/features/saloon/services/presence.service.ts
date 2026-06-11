import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { BehaviorSubject, finalize, Observable, of, shareReplay, Subject, tap } from 'rxjs';
import { environment } from 'src/environments/environment';
import { SaloonType } from '../models/saloonModel';

// Time constants
const SECONDS_PER_HOUR = 3600;
const SECONDS_PER_MINUTE = 60;
const MS_PER_SECOND = 1000;
const TIME_PAD_LENGTH = 2;
const ZERO = 0;
const DECREMENT = 1;
const DEFAULT_RADIUS = 5000;

// Types
export type UserPresence = {
  id: number;
  userName: string;
  imgUrl: string;
  profileImageUpdatedAt?: string | null;
  age: number | null;
  city: string | null;
};

export type PresenceInfo = {
  saloonId: number;
  saloonName: string;
  connectedCount: number;
  connectedUsers: UserPresence[];
};

export type JoinRequest = {
  lat: number | null;
  lng: number | null;
};

export type JoinResponse = {
  saloonId: number;
  saloonName: string;
  joinedAt: string;
  endsAt: string;
  connectedUsersCount: number;
  remainingSeconds: number;
};

export type ActiveSession = {
  userId: number;
  saloonId: number;
  saloonName: string;
  joinedAt: string;
  endsAt: string;
  remainingSeconds: number;
  active: boolean;
};

export type SessionResponse = {
  hasActiveSession: boolean;
  session?: ActiveSession;
  message?: string;
};

export type SaloonMapItem = {
  id: number;
  name: string;
  imgUrl: string;
  address: string;
  city: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
  distanceMeters: number | null;
  connectedCount: number;
  type?: SaloonType;
  isPrivate?: boolean;
};

export type PresenceEvent = {
  type: 'USER_JOINED' | 'USER_LEFT';
  saloonId: number;
  user?: UserPresence;
  userId?: number;
  connectedCount: number;
  timestamp: string;
};

export type SessionAlert = {
  type: 'SESSION_EXPIRING_SOON' | 'SESSION_EXPIRED';
  saloonId: number;
  remainingMinutes: number;
  message: string;
};

@Injectable({
  providedIn: 'root',
})
export class PresenceService {
  private _http = inject(HttpClient);
  private readonly _BASE_URL_API = environment.apiUrl;
  private _hasLoadedSession = false;
  private _sessionLoad$?: Observable<SessionResponse>;

  // État réactif de la session active
  private _activeSession$ = new BehaviorSubject<ActiveSession | null>(null);
  public activeSession$ = this._activeSession$.asObservable();

  // État réactif de la présence dans le saloon actuel
  private _currentPresence$ = new BehaviorSubject<PresenceInfo | null>(null);
  public currentPresence$ = this._currentPresence$.asObservable();

  // Timer pour le compte à rebours
  private _remainingSeconds$ = new BehaviorSubject<number>(ZERO);
  public remainingSeconds$ = this._remainingSeconds$.asObservable();

  // Event émis quand la session expire
  private _sessionExpired$ = new Subject<void>();
  public sessionExpired$ = this._sessionExpired$.asObservable();

  // Event émis quand la sortie est confirmée (après délai d'annulation)
  private _leaveConfirmed$ = new Subject<void>();
  public leaveConfirmed$ = this._leaveConfirmed$.asObservable();

  private _timerInterval: ReturnType<typeof setInterval> | null = null;

  /**
   * Rejoint un saloon.
   */
  joinSaloon(saloonId: number, lat: number | null, lng: number | null): Observable<JoinResponse> {
    const body: JoinRequest = { lat, lng };
    return this._http
      .post<JoinResponse>(`${this._BASE_URL_API}/api/saloons/${saloonId}/join`, body)
      .pipe(
        tap(response => {
          this._hasLoadedSession = true;
          const session: ActiveSession = {
            userId: 0, // Sera mis à jour
            saloonId: response.saloonId,
            saloonName: response.saloonName,
            joinedAt: response.joinedAt,
            endsAt: response.endsAt,
            remainingSeconds: response.remainingSeconds,
            active: true,
          };
          this._activeSession$.next(session);
          this._startTimer(response.remainingSeconds);
        })
      );
  }

  /**
   * Quitte un saloon.
   */
  leaveSaloon(saloonId: number): Observable<{ message: string }> {
    return this._http
      .post<{ message: string }>(`${this._BASE_URL_API}/api/saloons/${saloonId}/leave`, {})
      .pipe(
        tap(() => {
          this._hasLoadedSession = true;
          this._activeSession$.next(null);
          this._currentPresence$.next(null);
          this._stopTimer();
          this._leaveConfirmed$.next();
        })
      );
  }

  /**
   * Récupère la présence d'un saloon.
   */
  getPresence(saloonId: number): Observable<PresenceInfo> {
    return this._http
      .get<PresenceInfo>(`${this._BASE_URL_API}/api/saloons/${saloonId}/presence`)
      .pipe(
        tap(presence => {
          this._currentPresence$.next(presence);
        })
      );
  }

  /**
   * Récupère la session active de l'utilisateur connecté.
   */
  getMySession(): Observable<SessionResponse> {
    return this._http.get<SessionResponse>(`${this._BASE_URL_API}/api/users/me/session`).pipe(
      tap(response => {
        this._hasLoadedSession = true;
        if (response.hasActiveSession && response.session) {
          this._activeSession$.next(response.session);
          this._startTimer(response.session.remainingSeconds);
        } else {
          this._activeSession$.next(null);
          this._stopTimer();
        }
      })
    );
  }

  /**
   * Charge la session une seule fois et réutilise l'état déjà connu si disponible.
   */
  ensureMySessionLoaded(forceRefresh = false): Observable<SessionResponse> {
    if (forceRefresh) {
      this._hasLoadedSession = false;
      this._sessionLoad$ = undefined;
    }

    if (this._hasLoadedSession && !forceRefresh) {
      const session = this._activeSession$.value;
      return of(
        session
          ? { hasActiveSession: true, session }
          : { hasActiveSession: false, message: 'No active session' }
      );
    }

    if (!forceRefresh && this._sessionLoad$) {
      return this._sessionLoad$;
    }

    const request$ = this.getMySession().pipe(
      finalize(() => {
        this._sessionLoad$ = undefined;
      }),
      shareReplay({ bufferSize: 1, refCount: false })
    );

    this._sessionLoad$ = request$;
    return request$;
  }

  /**
   * Force la déconnexion de la session actuelle.
   */
  leaveCurrentSession(): Observable<{ message: string }> {
    return this._http
      .post<{ message: string }>(`${this._BASE_URL_API}/api/users/me/session/leave`, {})
      .pipe(
        tap(() => {
          this._hasLoadedSession = true;
          this._activeSession$.next(null);
          this._currentPresence$.next(null);
          this._stopTimer();
        })
      );
  }

  /**
   * Récupère les saloons à proximité.
   */
  getNearbySaloons(
    lat: number,
    lng: number,
    radius: number = DEFAULT_RADIUS
  ): Observable<SaloonMapItem[]> {
    return this._http.get<SaloonMapItem[]>(`${this._BASE_URL_API}/api/saloons/nearby`, {
      params: { lat: lat.toString(), lng: lng.toString(), radius: radius.toString() },
    });
  }

  /**
   * Récupère les saloons dans une bounding box.
   */
  getSaloonsInBbox(
    minLat: number,
    maxLat: number,
    minLng: number,
    maxLng: number
  ): Observable<SaloonMapItem[]> {
    return this._http.get<SaloonMapItem[]>(`${this._BASE_URL_API}/api/saloons/bbox`, {
      params: {
        minLat: minLat.toString(),
        maxLat: maxLat.toString(),
        minLng: minLng.toString(),
        maxLng: maxLng.toString(),
      },
    });
  }

  /**
   * Met à jour la présence localement (appelé par WebSocket).
   */
  updatePresenceFromEvent(event: PresenceEvent): void {
    const current = this._currentPresence$.value;
    if (!current || current.saloonId !== event.saloonId) return;

    if (event.type === 'USER_JOINED' && event.user) {
      const users = [...current.connectedUsers, event.user];
      this._currentPresence$.next({
        ...current,
        connectedCount: event.connectedCount,
        connectedUsers: users,
      });
    } else if (event.type === 'USER_LEFT' && event.userId) {
      const users = current.connectedUsers.filter(u => u.id !== event.userId);
      this._currentPresence$.next({
        ...current,
        connectedCount: event.connectedCount,
        connectedUsers: users,
      });
    }
  }

  /**
   * Démarre le timer de session.
   */
  private _startTimer(seconds: number): void {
    this._stopTimer();
    this._remainingSeconds$.next(seconds);

    this._timerInterval = setInterval(() => {
      const remaining = this._remainingSeconds$.value - DECREMENT;
      if (remaining <= ZERO) {
        this._stopTimer();
        const expiredSession = this._activeSession$.value;
        this._activeSession$.next(null);
        this._currentPresence$.next(null);
        this._remainingSeconds$.next(ZERO);

        // Notifier le backend que la session a expiré (pour créer le cooldown)
        if (expiredSession) {
          this._http
            .post(`${this._BASE_URL_API}/api/saloons/${expiredSession.saloonId}/leave`, {})
            .subscribe();
        }

        // Émettre l'événement d'expiration
        this._sessionExpired$.next();
      } else {
        this._remainingSeconds$.next(remaining);
      }
    }, MS_PER_SECOND);
  }

  /**
   * Arrête le timer.
   */
  private _stopTimer(): void {
    if (this._timerInterval) {
      clearInterval(this._timerInterval);
      this._timerInterval = null;
    }
  }

  /**
   * Getter pour vérifier si l'utilisateur a une session active.
   */
  hasActiveSession(): boolean {
    return this._activeSession$.value !== null;
  }

  /**
   * Getter pour la session active.
   */
  getActiveSessionValue(): ActiveSession | null {
    return this._activeSession$.value;
  }

  /**
   * Formate les secondes en HH:MM:SS.
   */
  formatTime(seconds: number): string {
    const h = Math.floor(seconds / SECONDS_PER_HOUR);
    const m = Math.floor((seconds % SECONDS_PER_HOUR) / SECONDS_PER_MINUTE);
    const s = seconds % SECONDS_PER_MINUTE;
    return `${h.toString().padStart(TIME_PAD_LENGTH, '0')}:${m
      .toString()
      .padStart(TIME_PAD_LENGTH, '0')}:${s.toString().padStart(TIME_PAD_LENGTH, '0')}`;
  }

  // ==================== LEAVE REQUEST / CANCEL ====================

  /**
   * Demande de sortie avec délai d'annulation.
   * Retourne le timestamp d'expiration (pendingUntil).
   */
  leaveRequest(
    saloonId: number
  ): Observable<{ message: string; pendingUntil: number; canUndo: boolean }> {
    return this._http
      .post<{ message: string; pendingUntil: number; canUndo: boolean }>(
        `${this._BASE_URL_API}/api/saloons/${saloonId}/leave-request`,
        {}
      )
      .pipe(
        tap(() => {
          // On garde la session en mémoire pour permettre le retour
          // mais on arrête le timer car l'utilisateur n'est plus dans le saloon
          this._stopTimer();
        })
      );
  }

  /**
   * Annule une sortie en attente (undo).
   */
  leaveCancel(saloonId: number): Observable<{ message: string; canRejoin: boolean }> {
    return this._http.post<{ message: string; canRejoin: boolean }>(
      `${this._BASE_URL_API}/api/saloons/${saloonId}/leave-cancel`,
      {}
    );
  }

  /**
   * Confirme définitivement une sortie.
   */
  leaveConfirm(saloonId: number): Observable<{ message: string }> {
    return this._http
      .post<{ message: string }>(`${this._BASE_URL_API}/api/saloons/${saloonId}/leave-confirm`, {})
      .pipe(
        tap(() => {
          this._hasLoadedSession = true;
          this._activeSession$.next(null);
          this._currentPresence$.next(null);
          this._leaveConfirmed$.next();
        })
      );
  }

  /**
   * Nettoie l'état local après sortie confirmée (appelé après expiration du délai).
   */
  clearSessionState(): void {
    this._hasLoadedSession = true;
    this._activeSession$.next(null);
    this._currentPresence$.next(null);
    this._stopTimer();
  }
}
