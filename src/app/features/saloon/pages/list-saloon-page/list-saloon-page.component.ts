import {
  AfterViewInit,
  Component,
  ElementRef,
  HostListener,
  ViewChild,
  inject,
  OnDestroy,
  OnInit,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import {
  BehaviorSubject,
  combineLatest,
  map,
  Observable,
  switchMap,
  Subject,
  takeUntil,
} from 'rxjs';
import { Saloon, SaloonType } from '../../models/saloonModel';
import { SaloonCardComponent } from '../../components/saloon-card/saloon-card.component';
import { SaloonApiService } from '../../services/saloon-api.service';
import { SaloonModalComponent } from '../../components/saloon-modal/saloon-modal.component';
import { SaloonMapItem, PresenceService } from '../../services/presence.service';
import { SaloonPresenceRealtimeService } from '../../services/saloon-presence-realtime.service';
import { AuthApiService } from 'src/app/features/auth/services/auth-api.service';
import { GeolocationService } from 'src/app/core/services/geolocation.service';

// Distance maximale pour afficher les saloons (en mètres)
const MAX_DISTANCE_METERS = 50000; // 50km

// Pagination
const ITEMS_PER_PAGE = 5;

// Type pour les filtres
type FilterType = 'ALL' | 'CHAUD' | SaloonType;

// Configuration des filtres
const FILTER_TABS: { value: FilterType; label: string }[] = [
  { value: 'ALL', label: 'Tous' },
  { value: 'CHAUD', label: 'Populaire' },
  { value: 'BAR', label: 'Bar' },
  { value: 'SPORT', label: 'Sport' },
  { value: 'PUBLIC', label: 'Public' },
  { value: 'LOISIRS', label: 'Loisirs' },
  { value: 'DISCO', label: 'Disco' },
  { value: 'TRAVAIL', label: 'Travail' },
];

@Component({
  selector: 'app-list-saloon-page',
  standalone: true,
  imports: [CommonModule, SaloonCardComponent, SaloonModalComponent],
  templateUrl: './list-saloon-page.component.html',
  styleUrl: './list-saloon-page.component.scss',
})
export class ListSaloonPageComponent implements OnInit, AfterViewInit, OnDestroy {
  private _saloonApiService = inject(SaloonApiService);
  private _presenceRealtimeService = inject(SaloonPresenceRealtimeService);
  private _presenceService = inject(PresenceService);
  private _router = inject(Router);
  private _authApiService = inject(AuthApiService);
  private _geoService = inject(GeolocationService);
  private _destroy$ = new Subject<void>();

  // Position utilisateur (délégué au service partagé)
  get userLat(): number | null {
    return this._geoService.userLat();
  }
  get userLng(): number | null {
    return this._geoService.userLng();
  }
  private _userPosition$ = new BehaviorSubject<{ lat: number; lng: number } | null>(null);
  private _refreshTrigger$ = new BehaviorSubject<void>(undefined);

  // État de la géolocalisation (délégué au service partagé)
  get geoLocationStatus(): typeof this._geoService.status {
    return this._geoService.status;
  }
  totalSaloonsCount = signal<number>(0);

  // Filtres
  filterTabs = FILTER_TABS;
  activeFilter = signal<FilterType>('ALL');
  filtersScrollHint = signal<'end' | 'start' | 'none'>('end');
  private _activeFilter$ = new BehaviorSubject<FilterType>('ALL');
  @ViewChild('filtersScroller') private _filtersScroller?: ElementRef<HTMLDivElement>;

  // Pagination
  currentPage = signal<number>(1);
  totalPages = signal<number>(1);
  filteredSaloonsCount = signal<number>(0);
  private _currentPage$ = new BehaviorSubject<number>(1);

  // Modal
  showModal = false;
  selectedSaloon: SaloonMapItem | null = null;

  get isReviewerOrAdmin(): boolean {
    const roles = this._authApiService.getUserRoles();
    return roles.includes('ROLE_REVIEWER') || roles.includes('ROLE_ADMIN');
  }

  // Saloons triés par distance avec mise à jour temps réel de la présence
  // Filtrés à MAX_DISTANCE_METERS (50km) de l'utilisateur
  saloons$: Observable<(Saloon & { distanceMeters: number | null })[]> = combineLatest([
    this._refreshTrigger$.pipe(switchMap(() => this._saloonApiService.getListSaloon())),
    this._userPosition$,
    this._presenceRealtimeService.presenceCounts$,
    this._activeFilter$,
    this._currentPage$,
  ]).pipe(
    map(([saloons, position, presenceCounts, filter, page]) => {
      // Sauvegarder le nombre total de saloons
      this.totalSaloonsCount.set(saloons.length);

      const saloonsWithDistance = saloons.map(saloon => {
        // Utiliser le compteur temps réel s'il existe, sinon celui du backend (déjà depuis Redis)
        const realtimeCount = presenceCounts.get(saloon.id);
        const finalCount = realtimeCount !== undefined ? realtimeCount : saloon.connectedCount;
        return {
          ...saloon,
          connectedCount: finalCount ?? 0,
          distanceMeters:
            position && saloon.latitude && saloon.longitude
              ? Math.round(
                  this._calculateDistance(
                    position.lat,
                    position.lng,
                    saloon.latitude,
                    saloon.longitude
                  )
                )
              : null,
        };
      });

      // Filtrer les saloons à moins de MAX_DISTANCE_METERS (50km)
      // Exception: reviewers/admins voient les saloons privés même s'ils sont loin
      let filteredSaloons = [] as (Saloon & { distanceMeters: number | null })[];
      if (position) {
        filteredSaloons = this.isReviewerOrAdmin
          ? saloonsWithDistance.filter(saloon =>
              saloon.isPrivate === true
                ? true
                : saloon.distanceMeters !== null && saloon.distanceMeters <= MAX_DISTANCE_METERS
            )
          : saloonsWithDistance.filter(
              saloon =>
                saloon.distanceMeters !== null && saloon.distanceMeters <= MAX_DISTANCE_METERS
            );
      } else if (this.isReviewerOrAdmin) {
        // Sans position, montrer uniquement les privés pour les reviewers/admins
        filteredSaloons = saloonsWithDistance.filter(saloon => saloon.isPrivate === true);
      }

      // Appliquer le filtre par type
      if (filter !== 'ALL' && filter !== 'CHAUD') {
        filteredSaloons = filteredSaloons.filter(saloon => saloon.type === filter);
      }

      // Tri selon le filtre
      if (filter === 'CHAUD') {
        // Tri par popularité (nombre de connectés, décroissant)
        filteredSaloons = filteredSaloons.sort(
          (a, b) => (b.connectedCount || 0) - (a.connectedCount || 0)
        );
      } else {
        // Tri par distance (les plus proches en premier)
        filteredSaloons = filteredSaloons.sort((a, b) => {
          if (a.distanceMeters === null && b.distanceMeters === null) return 0;
          if (a.distanceMeters === null) return 1;
          if (b.distanceMeters === null) return -1;
          return a.distanceMeters - b.distanceMeters;
        });
      }

      // Sauvegarder le nombre de résultats filtrés (avant pagination)
      this.filteredSaloonsCount.set(filteredSaloons.length);

      // Calculer le nombre total de pages
      const total = Math.ceil(filteredSaloons.length / ITEMS_PER_PAGE);
      this.totalPages.set(total || 1);

      // Paginer les résultats
      const startIndex = (page - 1) * ITEMS_PER_PAGE;
      return filteredSaloons.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    })
  );

  ngOnInit(): void {
    // Initialiser la géolocalisation via le service partagé
    this._geoService.init();
    // S'abonner aux changements de position du service
    this._geoService.userPosition$
      .pipe(takeUntil(this._destroy$))
      .subscribe(pos => this._userPosition$.next(pos));
    // Si le service a déjà une position, la propager immédiatement
    if (this._geoService.hasPosition()) {
      this._userPosition$.next({
        lat: this._geoService.userLat()!,
        lng: this._geoService.userLng()!,
      });
    }
    // Connecter au WebSocket pour les mises à jour temps réel
    this._presenceRealtimeService.connect();
    // Charger la session active de l'utilisateur (pour savoir s'il est dans un saloon)
    // prettier-ignore
    this._presenceService
      .ensureMySessionLoaded()
      .pipe(takeUntil(this._destroy$))
      .subscribe();
  }

  ngAfterViewInit(): void {
    queueMicrotask(() => this._syncFiltersScrollHint());
  }

  ngOnDestroy(): void {
    this._destroy$.next();
    this._destroy$.complete();
  }

  @HostListener('window:resize')
  onWindowResize(): void {
    this._syncFiltersScrollHint();
  }

  requestLocation(): void {
    this._geoService.requestLocation();
  }

  openLocationSettings(): void {
    this._geoService.openLocationSettings();
  }

  onFiltersScroll(scroller: HTMLDivElement): void {
    this._updateFiltersScrollHint(scroller);
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

  private _syncFiltersScrollHint(): void {
    if (this._filtersScroller) {
      this._updateFiltersScrollHint(this._filtersScroller.nativeElement);
    }
  }

  private _updateFiltersScrollHint(scroller: HTMLDivElement): void {
    const maxScrollLeft = scroller.scrollWidth - scroller.clientWidth;

    if (maxScrollLeft <= 2) {
      this.filtersScrollHint.set('none');
      return;
    }

    this.filtersScrollHint.set(scroller.scrollLeft >= maxScrollLeft - 4 ? 'start' : 'end');
  }

  openModal(saloon: Saloon & { distanceMeters: number | null }): void {
    // Convertir en SaloonMapItem pour le modal
    this.selectedSaloon = {
      id: saloon.id,
      name: saloon.name,
      imgUrl: saloon.imgUrl,
      address: saloon.address,
      city: saloon.city || '',
      latitude: saloon.latitude || 0,
      longitude: saloon.longitude || 0,
      radiusMeters: saloon.radiusMeters || 100,
      distanceMeters: saloon.distanceMeters,
      connectedCount: saloon.connectedCount || saloon.visitorNumber || 0,
      type: saloon.type,
      isPrivate: saloon.isPrivate,
    };
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.selectedSaloon = null;
  }

  setFilter(filter: FilterType): void {
    this.activeFilter.set(filter);
    this._activeFilter$.next(filter);
    // Réinitialiser la pagination quand on change de filtre
    this.currentPage.set(1);
    this._currentPage$.next(1);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
      this._currentPage$.next(page);
    }
  }

  previousPage(): void {
    if (this.currentPage() > 1) {
      this.goToPage(this.currentPage() - 1);
    }
  }

  nextPage(): void {
    if (this.currentPage() < this.totalPages()) {
      this.goToPage(this.currentPage() + 1);
    }
  }
  goToRequestSaloon(): void {
    this._router.navigate(['/saloon-demande']);
  }

  // Undo supprimé
}
