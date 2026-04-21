import { Injectable, signal, computed } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Capacitor } from '@capacitor/core';
import { Geolocation } from '@capacitor/geolocation';

export type GeoLocationStatus = 'prompt' | 'loading' | 'granted' | 'denied' | 'unavailable';

/**
 * Service singleton de géolocalisation partagé entre tous les composants.
 * - Ne demande la permission qu'une seule fois (premier appel)
 * - Cache la position pour les navigations suivantes
 * - Fournit un signal réactif pour le status et la position
 */
@Injectable({ providedIn: 'root' })
export class GeolocationService {
  private static readonly _LOCATION_PROMPTED_KEY = 'saloons_location_prompted';
  private static readonly _LOCATION_GRANTED_KEY = 'saloons_location_granted';
  private static readonly _LOCATION_CACHE_KEY = 'saloons_location_cache';

  // Status de la géolocalisation
  readonly status = signal<GeoLocationStatus>('prompt');

  // Position utilisateur (null si pas encore obtenue)
  readonly userLat = signal<number | null>(null);
  readonly userLng = signal<number | null>(null);

  // Observable pour les composants qui en ont besoin (ex: combineLatest)
  private _userPosition$ = new BehaviorSubject<{ lat: number; lng: number } | null>(null);
  readonly userPosition$ = this._userPosition$.asObservable();

  // Computed signal : position disponible ?
  readonly hasPosition = computed(() => this.userLat() !== null && this.userLng() !== null);

  // Flag interne : a-t-on déjà initialisé ?
  private _initialized = false;
  // Flag interne : fetch en cours ?
  private _fetching = false;

  constructor() {
    this._hydrateCachedState();
  }

  /**
   * Vérifie les permissions et récupère la position si déjà accordée.
   * Ne déclenche le prompt qu'une seule fois par session.
   * Les appels suivants retournent immédiatement le dernier état connu.
   */
  async init(): Promise<void> {
    // Si déjà en train de fetch ou si on a déjà la position, ne rien faire
    if (this._fetching) return;
    if (this.status() === 'granted' && this.hasPosition()) return;

    // Si déjà initialisé et status n'est pas 'prompt', ne pas re-vérifier
    if (this._initialized && this.status() !== 'prompt') return;

    this._initialized = true;
    await this._checkPermissionAndFetch();
  }

  /**
   * Demande explicitement la localisation (bouton "Activer la localisation").
   * Marque dans localStorage que l'utilisateur a été prompté.
   */
  requestLocation(): void {
    localStorage.setItem(GeolocationService._LOCATION_PROMPTED_KEY, 'true');
    this._fetchPosition();
  }

  /**
   * Ouvre les réglages de l'app (sur mobile)
   */
  openLocationSettings(): void {
    window.location.href = 'app-settings:';
  }

  /**
   * Vérifie les permissions et agit en conséquence :
   * - granted → récupère la position directement
   * - denied → affiche l'état denied
   * - prompt + jamais demandé → affiche le prompt
   * - prompt + déjà demandé → reste en prompt sans redemander
   */
  private async _checkPermissionAndFetch(): Promise<void> {
    if (Capacitor.isNativePlatform()) {
      try {
        const permStatus = await Geolocation.checkPermissions();
        if (permStatus.location === 'granted' || permStatus.coarseLocation === 'granted') {
          localStorage.setItem(GeolocationService.LOCATION_GRANTED_KEY, 'true');
          localStorage.setItem(GeolocationService._LOCATION_GRANTED_KEY, 'true');
          this._fetchPosition();
        } else if (permStatus.location === 'denied') {
          localStorage.removeItem(GeolocationService._LOCATION_GRANTED_KEY);
          this.status.set('denied');
        } else {
          // Permission 'prompt'
          const alreadyPrompted = localStorage.getItem(GeolocationService._LOCATION_PROMPTED_KEY);
          if (!alreadyPrompted) {
            this.status.set('prompt');
          } else {
            this.status.set(this.hasPosition() ? 'granted' : 'unavailable');
          }
        }
      } catch {
        this.status.set(this.hasPosition() ? 'granted' : 'unavailable');
      }
    } else {
      // Web desktop
      if ('permissions' in navigator && navigator.permissions?.query) {
        try {
          const result = await navigator.permissions.query({
            name: 'geolocation' as PermissionName,
          });
          if (result.state === 'granted') {
            localStorage.setItem(GeolocationService._LOCATION_GRANTED_KEY, 'true');
            this._fetchPosition();
          } else if (result.state === 'denied') {
            localStorage.removeItem(GeolocationService._LOCATION_GRANTED_KEY);
            this.status.set('denied');
          } else {
            const alreadyPrompted = localStorage.getItem(GeolocationService._LOCATION_PROMPTED_KEY);
            if (!alreadyPrompted) {
              this.status.set('prompt');
            } else {
              this.status.set(this.hasPosition() ? 'granted' : 'unavailable');
            }
          }
        } catch {
          const alreadyPrompted = localStorage.getItem(GeolocationService._LOCATION_PROMPTED_KEY);
          this.status.set(alreadyPrompted ? (this.hasPosition() ? 'granted' : 'unavailable') : 'prompt');
        }
      } else {
        const alreadyPrompted = localStorage.getItem(GeolocationService._LOCATION_PROMPTED_KEY);
        this.status.set(alreadyPrompted ? (this.hasPosition() ? 'granted' : 'unavailable') : 'prompt');
      }
    }
  }

  /**
   * Récupère la position de l'utilisateur.
   * Stratégie : d'abord position rapide (réseau), puis affinage GPS si besoin.
   */
  private _fetchPosition(): void {
    if (this._fetching) return;
    this._fetching = true;
    this.status.set('loading');

    if (Capacitor.isNativePlatform()) {
      // 1) Position rapide (réseau/WiFi) - timeout court
      Geolocation.getCurrentPosition({ enableHighAccuracy: false, timeout: 3000 })
        .then(position => {
          this._setPosition(position.coords.latitude, position.coords.longitude);
          // 2) Affinage GPS en arrière-plan (si la précision est faible)
          if (position.coords.accuracy > 100) {
            this._refineWithGps();
          }
        })
        .catch(() => {
          // Si échec réseau, essayer directement le GPS
          this._fetchHighAccuracy();
        });
    } else {
      // Web : position rapide d'abord
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          position => {
            this._setPosition(position.coords.latitude, position.coords.longitude);
          },
          error => {
            console.warn('Géolocalisation non disponible:', error.message);
            this._fetching = false;
            if (error.code === error.PERMISSION_DENIED) {
              localStorage.removeItem(GeolocationService._LOCATION_GRANTED_KEY);
              this.status.set('denied');
            } else {
              this.status.set(this.hasPosition() ? 'granted' : 'unavailable');
            }
          },
          { enableHighAccuracy: false, timeout: 5000, maximumAge: 60000 }
        );
      } else {
        this._fetching = false;
        this.status.set('unavailable');
      }
    }
  }

  /**
   * Fallback : GPS haute précision si le réseau échoue
   */
  private _fetchHighAccuracy(): void {
    Geolocation.getCurrentPosition({ enableHighAccuracy: true, timeout: 10000 })
      .then(position => {
        this._setPosition(position.coords.latitude, position.coords.longitude);
      })
      .catch(error => {
        console.warn('Géolocalisation non disponible:', error.message);
        this._fetching = false;
        if (error.message?.includes('denied') || error.message?.includes('permission')) {
          localStorage.removeItem(GeolocationService._LOCATION_GRANTED_KEY);
          this.status.set('denied');
        } else {
          this.status.set(this.hasPosition() ? 'granted' : 'unavailable');
        }
      });
  }

  /**
   * Affine la position avec le GPS (après avoir affiché la position réseau)
   */
  private _refineWithGps(): void {
    Geolocation.getCurrentPosition({ enableHighAccuracy: true, timeout: 8000 })
      .then(position => {
        // Met à jour seulement si meilleure précision
        this._setPosition(position.coords.latitude, position.coords.longitude);
      })
      .catch(() => {
        // Pas grave, on garde la position réseau
      });
  }

  private _setPosition(lat: number, lng: number): void {
    this._fetching = false;
    this.userLat.set(lat);
    this.userLng.set(lng);
    this._userPosition$.next({ lat, lng });
    localStorage.setItem(GeolocationService._LOCATION_GRANTED_KEY, 'true');
    localStorage.setItem(GeolocationService._LOCATION_CACHE_KEY, JSON.stringify({ lat, lng }));
    this.status.set('granted');
  }

  private _hydrateCachedState(): void {
    const granted = localStorage.getItem(GeolocationService._LOCATION_GRANTED_KEY);
    const rawPosition = localStorage.getItem(GeolocationService._LOCATION_CACHE_KEY);

    if (!granted || !rawPosition) {
      return;
    }

    try {
      const parsed = JSON.parse(rawPosition) as { lat?: number; lng?: number };
      if (typeof parsed.lat === 'number' && typeof parsed.lng === 'number') {
        this.userLat.set(parsed.lat);
        this.userLng.set(parsed.lng);
        this._userPosition$.next({ lat: parsed.lat, lng: parsed.lng });
        this.status.set('granted');
      }
    } catch {
      localStorage.removeItem(GeolocationService._LOCATION_CACHE_KEY);
    }
  }
}
