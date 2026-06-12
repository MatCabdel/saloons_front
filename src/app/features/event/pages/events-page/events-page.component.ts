import {
  AfterViewInit,
  Component,
  ElementRef,
  HostListener,
  OnDestroy,
  OnInit,
  Signal,
  ViewChild,
  inject,
  signal,
} from '@angular/core';
import { CommonModule, registerLocaleData } from '@angular/common';
import { Router } from '@angular/router';
import { BehaviorSubject, combineLatest, switchMap, Subject, takeUntil, tap } from 'rxjs';
import { EventItem, EventPeriod, PagedEvents } from '../../models/event.model';
import { EventCardComponent } from '../../components/event-card/event-card.component';
import { EventApiService } from '../../services/event-api.service';
import { SaloonMapItem } from 'src/app/features/saloon/services/presence.service';
import {
  SaloonModalComponent,
  EventInfoForModal,
} from 'src/app/features/saloon/components/saloon-modal/saloon-modal.component';
import { GeolocationService, GeoLocationStatus } from 'src/app/core/services/geolocation.service';
import localeFr from '@angular/common/locales/fr';

registerLocaleData(localeFr);

// Pagination côté serveur
const PAGE_SIZE = 10;

// Filtres de période
const PERIOD_TABS: { value: EventPeriod; label: string }[] = [
  { value: 'all', label: 'Tous' },
  { value: 'today', label: "Aujourd'hui" },
  { value: 'week', label: 'Cette semaine' },
  { value: 'month', label: 'Ce mois' },
];

@Component({
  selector: 'app-events-page',
  standalone: true,
  imports: [CommonModule, EventCardComponent, SaloonModalComponent],
  templateUrl: './events-page.component.html',
  styleUrl: './events-page.component.scss',
})
export class EventsPageComponent implements OnInit, AfterViewInit, OnDestroy {
  private _eventApiService = inject(EventApiService);
  private _router = inject(Router);
  private _geoService = inject(GeolocationService);
  private _destroy$ = new Subject<void>();

  // Filtres
  periodTabs = PERIOD_TABS;
  activePeriod = signal<EventPeriod>('all');
  filtersScrollHint = signal<'end' | 'start' | 'none'>('end');
  private _activePeriod$ = new BehaviorSubject<EventPeriod>('all');
  @ViewChild('filtersScroller') private _filtersScroller?: ElementRef<HTMLDivElement>;

  // Labels par période
  private readonly _periodLabels: Record<EventPeriod, string> = {
    today: "aujourd'hui",
    week: 'cette semaine',
    month: 'ce mois-ci',
    all: '',
  };
  periodLabel = signal<string>('');

  // Pagination (serveur)
  currentPage = signal<number>(1);
  totalPages = signal<number>(1);
  eventsCount = signal<number>(0);
  private _currentPage$ = new BehaviorSubject<number>(0); // 0-indexed pour le backend

  // Events
  events = signal<EventItem[]>([]);
  loading = signal<boolean>(false);

  // Modal Saloon (réutilisation de SaloonModalComponent)
  showModal = false;
  selectedSaloon: SaloonMapItem | null = null;
  selectedEventInfo: EventInfoForModal | null = null;
  selectedEventId: number | null = null;

  // Geolocation
  get userLat(): number | null {
    return this._geoService.userLat();
  }
  get userLng(): number | null {
    return this._geoService.userLng();
  }
  get geoLocationStatus(): Signal<GeoLocationStatus> {
    return this._geoService.status;
  }

  ngOnInit(): void {
    this._geoService.init();

    // Combine period + page + user position → server-side fetch with geo filter
    combineLatest([this._activePeriod$, this._currentPage$, this._geoService.userPosition$])
      .pipe(
        takeUntil(this._destroy$),
        tap(() => this.loading.set(true)),
        switchMap(([period, page, position]) =>
          this._eventApiService.getEvents(
            period,
            page,
            PAGE_SIZE,
            position?.lat ?? null,
            position?.lng ?? null
          )
        )
      )
      .subscribe((pagedResponse: PagedEvents) => {
        this.events.set(pagedResponse.content);
        this.eventsCount.set(pagedResponse.totalElements);
        this.totalPages.set(Math.max(1, pagedResponse.totalPages));
        this.currentPage.set(pagedResponse.number + 1); // 1-indexed pour l'affichage
        this.loading.set(false);
      });
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

  // ─── Filters / Pagination ─────────────────────────────
  setPeriod(period: EventPeriod): void {
    this.activePeriod.set(period);
    this.periodLabel.set(this._periodLabels[period]);
    this._activePeriod$.next(period);
    // Retour à la première page quand on change de filtre
    this._currentPage$.next(0);
  }

  onFiltersScroll(scroller: HTMLDivElement): void {
    this._updateFiltersScrollHint(scroller);
  }

  nextPage(): void {
    if (this.currentPage() < this.totalPages()) {
      this._currentPage$.next(this.currentPage()); // currentPage() est 1-indexed, backend attend 0-indexed
    }
  }

  prevPage(): void {
    if (this.currentPage() > 1) {
      this._currentPage$.next(this.currentPage() - 2); // 1-indexed → 0-indexed
    }
  }

  // ─── Modal ────────────────────────────────────────────
  onEventClick(event: EventItem): void {
    // Convertir en SaloonMapItem pour le composant SaloonModal
    this.selectedSaloon = {
      id: event.saloonId,
      name: event.saloonName,
      imgUrl: event.saloonImgUrl || '',
      address: event.saloonAddress || '',
      city: event.saloonCity || '',
      latitude: event.saloonLatitude || 0,
      longitude: event.saloonLongitude || 0,
      radiusMeters: event.saloonRadiusMeters || 0,
      distanceMeters: this._computeDistance(event),
      connectedCount: 0,
      type: (event.saloonType as SaloonMapItem['type']) || undefined,
      isPrivate: event.saloonIsPrivate,
    };

    // Infos de l'événement à afficher au-dessus
    this.selectedEventInfo = {
      title: event.title,
      subTitle: event.subTitle,
      imageUrl: event.imageUrl,
      description: event.description,
      startDateTime: event.startDateTime,
      eventId: event.id,
      interestedCount: event.interestedCount ?? 0,
      isInterested: event.isInterested ?? false,
    };

    this.selectedEventId = event.id;
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.selectedSaloon = null;
    this.selectedEventInfo = null;
    this.selectedEventId = null;
  }

  requestLocation(): void {
    this._geoService.requestLocation();
  }

  onToggleInterest(event: EventItem): void {
    this._eventApiService.toggleInterest(event.id).subscribe({
      next: res => {
        event.isInterested = res.interested;
        event.interestedCount = res.interestedCount;
      },
    });
  }

  // ─── Private ──────────────────────────────────────────
  private _computeDistance(event: EventItem): number | null {
    const lat = this._geoService.userLat();
    const lng = this._geoService.userLng();
    if (lat === null || lng === null || !event.saloonLatitude || !event.saloonLongitude) {
      return null;
    }
    return Math.round(
      this._calculateDistance(lat, lng, event.saloonLatitude, event.saloonLongitude)
    );
  }

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
}
