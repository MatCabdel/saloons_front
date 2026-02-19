import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import * as L from 'leaflet';
import { Subject, takeUntil } from 'rxjs';
import { Capacitor } from '@capacitor/core';
import { Geolocation } from '@capacitor/geolocation';
import { SaloonModalComponent } from '../saloon-modal/saloon-modal.component';
import { SaloonMapItem } from '../../services/presence.service';
import { SaloonApiService } from '../../services/saloon-api.service';
import { Saloon } from '../../models/saloonModel';

const GEO_TIMEOUT_MS = 6000;
const GEO_MAX_AGE_MS = 5 * 60 * 1000;
const LOCATION_CACHE_KEY = 'saloons_last_location';

@Component({
  selector: 'app-map',
  standalone: true,
  imports: [CommonModule, SaloonModalComponent],
  templateUrl: './map.component.html',
  styleUrl: './map.component.scss',
})
export class MapComponent implements OnInit, OnDestroy {
  map: any;
  private _markers: L.Marker[] = [];
  private _userMarker: L.Marker | null = null;
  private _destroy$ = new Subject<void>();
  private _saloonApiService = inject(SaloonApiService);

  // Modal state
  showModal = false;
  selectedSaloon: SaloonMapItem | null = null;
  userLat: number | null = null;
  userLng: number | null = null;
  geoLocationStatus: 'prompt' | 'loading' | 'granted' | 'denied' | 'unavailable' = 'prompt';

  private _customIcon = L.icon({
    iconUrl: 'assets/icons/mapmarker.svg',
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -40],
  });

  // Icône bleue pour la position de l'utilisateur
  private _userIcon = L.divIcon({
    className: 'user-location-marker',
    html: `<div class="user-marker-dot"></div><div class="user-marker-pulse"></div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });

  // Données des saloons chargées depuis l'API
  private _saloonsData: SaloonMapItem[] = [];

  ngOnInit(): void {
    this.configMap();
    this._loadSaloons();
    this._hydrateLocationFromCache();
    this._maybeAutoFetchLocation();
  }

  ngOnDestroy(): void {
    this._destroy$.next();
    this._destroy$.complete();
    if (this.map) {
      this.map.remove();
    }
  }

  /**
   * Charge les saloons depuis l'API
   */
  private _loadSaloons(): void {
    this._saloonApiService
      .getListSaloon()
      .pipe(takeUntil(this._destroy$))
      .subscribe({
        next: saloons => {
          this._saloonsData = saloons.map(saloon => this._mapSaloonToMapItem(saloon));
          this._updateDistances();
          this._addMarkers();
        },
        error: err => {
          console.error('Erreur lors du chargement des saloons:', err);
        },
      });
  }

  /**
   * Convertit un Saloon en SaloonMapItem
   */
  private _mapSaloonToMapItem(saloon: Saloon): SaloonMapItem {
    return {
      id: saloon.id,
      name: saloon.name,
      imgUrl: saloon.imgUrl,
      address: saloon.address,
      city: saloon.city || '',
      latitude: saloon.latitude || 0,
      longitude: saloon.longitude || 0,
      radiusMeters: saloon.radiusMeters || 100,
      distanceMeters: null,
      connectedCount: saloon.visitorNumber || saloon.visitors || 0,
      type: saloon.type,
      isPrivate: saloon.isPrivate,
    };
  }

  configMap(): void {
    this.map = L.map('map', {
      center: [44.837789, -0.57918],
      zoom: 14,
    });
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.map);
  }

  private _addMarkers(): void {
    // Supprimer les anciens markers
    this._markers.forEach(marker => this.map.removeLayer(marker));
    this._markers = [];

    this._saloonsData.forEach(saloon => {
      // Ne pas ajouter si pas de coordonnées
      if (!saloon.latitude || !saloon.longitude) return;

      const marker = L.marker([saloon.latitude, saloon.longitude], {
        icon: this._customIcon,
      }).addTo(this.map);

      // Au clic sur le marker, ouvrir le modal avec le saloon actualisé
      marker.on('click', () => {
        const currentSaloon = this._saloonsData.find(s => s.id === saloon.id);
        if (currentSaloon) {
          this._openModal(currentSaloon);
        }
      });

      this._markers.push(marker);
    });
  }

  private _getUserLocation(showLoading: boolean = true): void {
    if (showLoading) {
      this.geoLocationStatus = 'loading';
    }

    // Sur mobile (iOS/Android), utiliser le plugin Capacitor
    // Évite le popup "localhost" qui apparaît avec navigator.geolocation dans WebView
    if (Capacitor.isNativePlatform()) {
      Geolocation.getCurrentPosition({
        enableHighAccuracy: false,
        timeout: GEO_TIMEOUT_MS,
        maximumAge: GEO_MAX_AGE_MS,
      })
        .then(position => {
          this.userLat = position.coords.latitude;
          this.userLng = position.coords.longitude;
          this._persistLocationInCache(this.userLat, this.userLng);
          this.geoLocationStatus = 'granted';

          // Mettre à jour les distances
          this._updateDistances();

          // Ajouter le marqueur de position utilisateur
          this._addUserMarker();

          // Centrer la carte sur l'utilisateur
          this.map.setView([this.userLat, this.userLng], 15);
        })
        .catch(error => {
          console.warn('Géolocalisation non disponible:', error.message);
          if (!showLoading && this.userLat !== null && this.userLng !== null) {
            return;
          }
          if (error.message?.includes('denied') || error.message?.includes('permission')) {
            this.geoLocationStatus = 'denied';
          } else {
            this.geoLocationStatus = 'unavailable';
          }
        });
    } else {
      // Sur web (desktop), utiliser navigator.geolocation
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          position => {
            this.userLat = position.coords.latitude;
            this.userLng = position.coords.longitude;
            this._persistLocationInCache(this.userLat, this.userLng);
            this.geoLocationStatus = 'granted';

            // Mettre à jour les distances
            this._updateDistances();

            // Ajouter le marqueur de position utilisateur
            this._addUserMarker();

            // Centrer la carte sur l'utilisateur
            this.map.setView([this.userLat, this.userLng], 15);
          },
          error => {
            console.warn('Géolocalisation non disponible:', error.message);
            if (!showLoading && this.userLat !== null && this.userLng !== null) {
              return;
            }
            if (error.code === error.PERMISSION_DENIED) {
              this.geoLocationStatus = 'denied';
            } else {
              this.geoLocationStatus = 'unavailable';
            }
          },
          { enableHighAccuracy: false, timeout: GEO_TIMEOUT_MS, maximumAge: GEO_MAX_AGE_MS }
        );
      } else {
        this.geoLocationStatus = 'unavailable';
      }
    }
  }

  private _addUserMarker(): void {
    if (this.userLat === null || this.userLng === null) return;

    // Supprimer l'ancien marqueur s'il existe
    if (this._userMarker) {
      this.map.removeLayer(this._userMarker);
    }

    // Ajouter le nouveau marqueur
    this._userMarker = L.marker([this.userLat, this.userLng], { icon: this._userIcon }).addTo(
      this.map
    );
  }

  /**
   * Recentre la carte sur la position de l'utilisateur
   */
  centerOnUser(): void {
    if (this.userLat !== null && this.userLng !== null) {
      this._addUserMarker();
      this.map.setView([this.userLat, this.userLng], 15);
    } else {
      // Si pas de position, demander à nouveau
      this.requestLocation();
    }
  }

  private _updateDistances(): void {
    if (this.userLat === null || this.userLng === null) return;

    this._saloonsData = this._saloonsData.map(saloon => ({
      ...saloon,
      distanceMeters: Math.round(
        this._calculateDistance(this.userLat!, this.userLng!, saloon.latitude, saloon.longitude)
      ),
    }));
  }

  private _calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371000; // Rayon de la Terre en mètres
    const dLat = this._toRad(lat2 - lat1);
    const dLng = this._toRad(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this._toRad(lat1)) *
        Math.cos(this._toRad(lat2)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private _toRad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  private _openModal(saloon: SaloonMapItem): void {
    // Recalculer la distance pour ce saloon spécifique
    if (this.userLat !== null && this.userLng !== null) {
      saloon.distanceMeters = Math.round(
        this._calculateDistance(this.userLat, this.userLng, saloon.latitude, saloon.longitude)
      );
    }
    this.selectedSaloon = saloon;
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.selectedSaloon = null;
  }

  requestLocation(): void {
    localStorage.setItem('saloons_location_prompted', 'true');
    this._getUserLocation(true);
  }

  openLocationSettings(): void {
    window.location.href = 'app-settings:';
  }

  private _maybeAutoFetchLocation(): void {
    // Si l'utilisateur a déjà accepté la géoloc précédemment, récupérer directement
    const alreadyPrompted = localStorage.getItem('saloons_location_prompted');

    // Sur mobile (Capacitor), vérifier avec le plugin natif
    if (Capacitor.isNativePlatform()) {
      if (alreadyPrompted) {
        // Déjà passé par le prompt custom, récupérer la position directement
        this._getUserLocation(false);
      }
      // Sinon, laisser afficher le prompt custom (geoLocationStatus = 'prompt')
      return;
    }

    // Sur web, utiliser l'API Permissions si disponible
    if (!('permissions' in navigator) || !navigator.permissions?.query) {
      // API non dispo, se fier au localStorage
      if (alreadyPrompted) {
        this._getUserLocation(false);
      }
      return;
    }

    navigator.permissions
      .query({ name: 'geolocation' as PermissionName })
      .then(result => {
        if (result.state === 'granted') {
          // Permission déjà accordée, récupérer position sans afficher modal
          localStorage.setItem('saloons_location_prompted', 'true');
          this._getUserLocation(false);
        } else if (result.state === 'denied') {
          // Permission refusée, afficher l'état denied
          this.geoLocationStatus = 'denied';
        }
        // Si 'prompt', laisser afficher le prompt custom
      })
      .catch(() => {
        // Ignore permissions API errors, se fier au localStorage
        if (alreadyPrompted) {
          this._getUserLocation(false);
        }
      });
  }

  private _hydrateLocationFromCache(): void {
    const raw = localStorage.getItem(LOCATION_CACHE_KEY);
    if (!raw) return;

    try {
      const cached = JSON.parse(raw) as { lat: number; lng: number };
      if (Number.isFinite(cached.lat) && Number.isFinite(cached.lng)) {
        this.userLat = cached.lat;
        this.userLng = cached.lng;
        this.geoLocationStatus = 'granted';
        this._updateDistances();
        this._addUserMarker();
      }
    } catch {
      localStorage.removeItem(LOCATION_CACHE_KEY);
    }
  }

  private _persistLocationInCache(lat: number, lng: number): void {
    localStorage.setItem(LOCATION_CACHE_KEY, JSON.stringify({ lat, lng }));
  }
}
