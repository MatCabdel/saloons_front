import { Component, OnInit, OnDestroy, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import * as L from 'leaflet';
import 'leaflet.markercluster';
import {
  Subject,
  debounceTime,
  switchMap,
  takeUntil,
  catchError,
  skip,
  tap,
  of,
  map,
} from 'rxjs';
import { SaloonModalComponent } from '../saloon-modal/saloon-modal.component';
import { SaloonMapItem } from '../../services/presence.service';
import { SaloonApiService } from '../../services/saloon-api.service';
import { Saloon, SaloonType } from '../../models/saloonModel';
import { GeolocationService, GeoLocationStatus } from 'src/app/core/services/geolocation.service';
import { SaloonBrowseStateService } from '../../services/saloon-browse-state.service';
import { toSaloonTypeFilter } from '../../models/saloon-browse.model';
import { toObservable } from '@angular/core/rxjs-interop';
import { AuthApiService } from 'src/app/features/auth/services/auth-api.service';

// Constantes de configuration
const DEBOUNCE_MS = 400;
const BUFFER_RATIO = 0.3;
const CLUSTER_ZOOM_THRESHOLD = 15;
const DEFAULT_CENTER: L.LatLngExpression = [44.837789, -0.57918];
const DEFAULT_ZOOM = 14;
const USER_ZOOM = 15;
const MAX_CLUSTER_RADIUS = 80;

@Component({
  selector: 'app-map',
  standalone: true,
  imports: [CommonModule, SaloonModalComponent],
  templateUrl: './map.component.html',
  styleUrl: './map.component.scss',
})
export class MapComponent implements OnInit, OnDestroy {
  map!: L.Map;
  private _clusterGroup!: L.MarkerClusterGroup;
  private _userMarker: L.Marker | null = null;
  private _destroy$ = new Subject<void>();
  private _mapMove$ = new Subject<void>();
  private _fetchTrigger$ = new Subject<{
    bounds: L.LatLngBounds;
    type: SaloonType | null;
  }>();

  private _saloonApiService = inject(SaloonApiService);
  private _geoService = inject(GeolocationService);
  private _browseState = inject(SaloonBrowseStateService);
  private _authApiService = inject(AuthApiService);

  // Modal state
  showModal = false;
  selectedSaloon: SaloonMapItem | null = null;

  // Déléguer au service partagé
  get userLat(): number | null {
    return this._geoService.userLat();
  }
  get userLng(): number | null {
    return this._geoService.userLng();
  }
  get geoLocationStatus(): GeoLocationStatus {
    return this._geoService.status();
  }

  get isReviewerOrAdmin(): boolean {
    const roles = this._authApiService.getUserRoles();
    return roles.includes('ROLE_REVIEWER') || roles.includes('ROLE_ADMIN');
  }

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

  // Observable du filtre actif – créé dans l'injection context
  private _activeFilter$ = toObservable(this._browseState.activeFilter);

  // Cache mémoire
  private _cachedSaloons: SaloonMapItem[] = [];
  private _loadedBounds: L.LatLngBounds | null = null;
  private _currentTypeFilter: SaloonType | null = null;
  private _isProgrammaticMove = false;

  // Effet réactif : dès que la position change dans le service, mettre à jour la carte
  private _positionEffect = effect(() => {
    const lat = this._geoService.userLat();
    const lng = this._geoService.userLng();
    const status = this._geoService.status();

    if (status === 'granted' && lat !== null && lng !== null && this.map) {
      this._addUserMarker();
      // Marquer le déplacement comme programmatique pour éviter le double-trigger
      // via moveend (qui causerait une annulation switchMap sur réseau lent)
      this._isProgrammaticMove = true;
      this.map.setView([lat, lng], USER_ZOOM);
    }
  });

  ngOnInit(): void {
    this._browseState.setVisibleSaloonCount(0);
    this._currentTypeFilter = toSaloonTypeFilter(this._browseState.activeFilter());

    this._initMap();
    this._setupFetchPipeline();
    this._setupMapMoveListener();
    this._setupFilterListener();

    // Chargement initial avec les bounds visibles
    this._triggerFetch();

    // Géolocalisation
    this._geoService.init();
  }

  ngOnDestroy(): void {
    this._destroy$.next();
    this._destroy$.complete();
    if (this.map) {
      this.map.off('moveend');
      this.map.remove();
    }
  }

  // ==================== Initialisation ====================

  private _initMap(): void {
    this.map = L.map('map', {
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
    });

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.map);

    // Cluster group : déclustering automatique à partir du zoom 12
    this._clusterGroup = L.markerClusterGroup({
      disableClusteringAtZoom: CLUSTER_ZOOM_THRESHOLD,
      maxClusterRadius: MAX_CLUSTER_RADIUS,
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
      zoomToBoundsOnClick: true,
      chunkedLoading: true,
    });
    this.map.addLayer(this._clusterGroup);
    requestAnimationFrame(() => this.map.invalidateSize());
  }

  // ==================== Pipeline de chargement ====================

  /**
   * Pipeline RxJS : fetchTrigger$ → switchMap (annule les requêtes obsolètes)
   */
  private _setupFetchPipeline(): void {
    this._fetchTrigger$
      .pipe(
        switchMap(({ bounds, type }) => {
          const expanded = this._expandBounds(bounds);
          return this._saloonApiService
            .getSaloonsForMap({
              minLat: expanded.getSouth(),
              maxLat: expanded.getNorth(),
              minLng: expanded.getWest(),
              maxLng: expanded.getEast(),
              type,
            })
            .pipe(
              tap(() => {
                this._loadedBounds = expanded;
              }),
              switchMap(saloons =>
                saloons.length > 0 ? of(saloons) : this._loadAllAccessibleSaloons(type)
              ),
              catchError(err => {
                console.error('Erreur chargement saloons map:', err);
                return this._loadAllAccessibleSaloons(type).pipe(
                  catchError(fallbackErr => {
                    console.error('Fallback saloons also failed:', fallbackErr);
                    return of([] as SaloonMapItem[]);
                  })
                );
              })
            );
        }),
        takeUntil(this._destroy$)
      )
      .subscribe(saloons => {
        this._cachedSaloons = saloons;
        this._browseState.setVisibleSaloonCount(saloons.length);
        this._updateMarkers();
      });
  }

  private _loadAllAccessibleSaloons(type: SaloonType | null): ReturnType<
    SaloonApiService['getSaloonsForMap']
  > {
    return this._saloonApiService.getListSaloon(type).pipe(
      map(saloons => saloons.filter(saloon => saloon.latitude && saloon.longitude)),
      map(saloons => saloons.map(saloon => this._toMapItem(saloon)))
    );
  }

  private _toMapItem(saloon: Saloon): SaloonMapItem {
    return {
      id: saloon.id,
      name: saloon.name,
      imgUrl: saloon.imgUrl,
      address: saloon.address,
      city: saloon.city || '',
      latitude: saloon.latitude || 0,
      longitude: saloon.longitude || 0,
      radiusMeters: saloon.radiusMeters || 0,
      distanceMeters: null,
      connectedCount: saloon.connectedCount || saloon.visitors || saloon.visitorNumber || 0,
      type: saloon.type,
      isPrivate: saloon.isPrivate,
    };
  }

  /**
   * Écoute moveend avec debounce, ne recharge que si hors zone tampon.
   * Les déplacements programmatiques (setView depuis l'effect) déclenchent
   * directement un fetch unique pour éviter la race condition avec switchMap.
   */
  private _setupMapMoveListener(): void {
    this.map.on('moveend', () => {
      if (this._isProgrammaticMove) {
        this._isProgrammaticMove = false;
        this._loadedBounds = null;
        this._triggerFetch();
        return;
      }
      this._mapMove$.next();
    });

    this._mapMove$.pipe(debounceTime(DEBOUNCE_MS), takeUntil(this._destroy$)).subscribe(() => {
      const bounds = this.map.getBounds();
      if (!this._isWithinLoadedBuffer(bounds)) {
        this._triggerFetch();
      }
    });
  }

  /**
   * Changement de filtre → invalide le cache et recharge immédiatement
   */
  private _setupFilterListener(): void {
    this._activeFilter$.pipe(skip(1), takeUntil(this._destroy$)).subscribe(filter => {
      this._currentTypeFilter = toSaloonTypeFilter(filter);
      this._loadedBounds = null;
      this._triggerFetch();
    });
  }

  /**
   * Déclenche un fetch avec les bounds actuels et le filtre courant
   */
  private _triggerFetch(): void {
    this._fetchTrigger$.next({
      bounds: this.map.getBounds(),
      type: this._currentTypeFilter,
    });
  }

  // ==================== Zone tampon (buffer) ====================

  /**
   * Vérifie si les bounds visibles sont entièrement contenus dans la zone tampon déjà chargée
   */
  private _isWithinLoadedBuffer(bounds: L.LatLngBounds): boolean {
    if (!this._loadedBounds) return false;
    return this._loadedBounds.contains(bounds);
  }

  /**
   * Étend les bounds de BUFFER_RATIO (30%) sur chaque côté pour créer une zone tampon
   */
  private _expandBounds(bounds: L.LatLngBounds): L.LatLngBounds {
    const latDiff = bounds.getNorth() - bounds.getSouth();
    const lngDiff = bounds.getEast() - bounds.getWest();
    const latBuffer = latDiff * BUFFER_RATIO;
    const lngBuffer = lngDiff * BUFFER_RATIO;

    return L.latLngBounds(
      [bounds.getSouth() - latBuffer, bounds.getWest() - lngBuffer],
      [bounds.getNorth() + latBuffer, bounds.getEast() + lngBuffer]
    );
  }

  // ==================== Marqueurs ====================

  /**
   * Reconstruit les marqueurs dans le cluster group à partir du cache
   */
  private _updateMarkers(): void {
    this._clusterGroup.clearLayers();

    const markers = this._cachedSaloons
      .filter(s => s.latitude && s.longitude)
      .map(saloon => {
        const marker = L.marker([saloon.latitude, saloon.longitude], {
          icon: this._customIcon,
        });
        marker.on('click', () => this._openModal(saloon));
        return marker;
      });

    this._clusterGroup.addLayers(markers);
  }

  /**
   * Recentre la carte sur la position de l'utilisateur
   */
  centerOnUser(): void {
    if (this.userLat !== null && this.userLng !== null) {
      this.map.setView([this.userLat, this.userLng], USER_ZOOM);
    } else {
      this.requestLocation();
    }
  }

  private _addUserMarker(): void {
    if (this.userLat === null || this.userLng === null) return;

    if (this._userMarker) {
      this.map.removeLayer(this._userMarker);
    }
    this._userMarker = L.marker([this.userLat, this.userLng], { icon: this._userIcon }).addTo(
      this.map
    );
  }

  // ==================== Distance (calcul à la demande) ====================

  private _calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371000;
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

  // ==================== Modal ====================

  private _openModal(saloon: SaloonMapItem): void {
    const withDistance = { ...saloon };
    if (this.userLat !== null && this.userLng !== null) {
      withDistance.distanceMeters = Math.round(
        this._calculateDistance(this.userLat, this.userLng, saloon.latitude, saloon.longitude)
      );
    }
    this.selectedSaloon = withDistance;
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.selectedSaloon = null;
  }

  requestLocation(): void {
    this._geoService.requestLocation();
  }

  openLocationSettings(): void {
    this._geoService.openLocationSettings();
  }
}
