import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BehaviorSubject, combineLatest, map, Observable, switchMap, Subject, takeUntil } from 'rxjs';
import { Saloon } from '../../models/saloonModel';
import { SaloonCardComponent } from '../../components/saloon-card/saloon-card.component';
import { SaloonApiService } from '../../services/saloon-api.service';
import { SaloonModalComponent } from '../../components/saloon-modal/saloon-modal.component';
import { SaloonMapItem, PresenceService } from '../../services/presence.service';
import { SaloonPresenceRealtimeService } from '../../services/saloon-presence-realtime.service';

@Component({
  selector: 'app-list-saloon-page',
  standalone: true,
  imports: [CommonModule, SaloonCardComponent, SaloonModalComponent],
  templateUrl: './list-saloon-page.component.html',
  styleUrl: './list-saloon-page.component.scss',
})
export class ListSaloonPageComponent implements OnInit, OnDestroy {
  private _saloonApiService = inject(SaloonApiService);
  private _presenceRealtimeService = inject(SaloonPresenceRealtimeService);
  private _presenceService = inject(PresenceService);
  private _destroy$ = new Subject<void>();

  // Position utilisateur
  userLat: number | null = null;
  userLng: number | null = null;
  private _userPosition$ = new BehaviorSubject<{ lat: number; lng: number } | null>(null);
  private _refreshTrigger$ = new BehaviorSubject<void>(undefined);

  // Modal
  showModal = false;
  selectedSaloon: SaloonMapItem | null = null;

  // Saloons triés par distance avec mise à jour temps réel de la présence
  saloons$: Observable<(Saloon & { distanceMeters: number | null })[]> = combineLatest([
    this._refreshTrigger$.pipe(switchMap(() => this._saloonApiService.getListSaloon())),
    this._userPosition$,
    this._presenceRealtimeService.presenceCounts$,
  ]).pipe(
    map(([saloons, position, presenceCounts]) => {
      const saloonsWithDistance = saloons.map(saloon => {
        // Utiliser le compteur temps réel s'il existe, sinon celui du backend (déjà depuis Redis)
        const realtimeCount = presenceCounts.get(saloon.id);
        const finalCount = realtimeCount !== undefined ? realtimeCount : saloon.connectedCount;
        console.log(`🏠 Saloon ${saloon.name}: realtimeCount=${realtimeCount}, backend.connectedCount=${saloon.connectedCount}, final=${finalCount}`);
        return {
          ...saloon,
          connectedCount: finalCount ?? 0,
          distanceMeters:
            position && saloon.latitude && saloon.longitude
              ? Math.round(this._calculateDistance(position.lat, position.lng, saloon.latitude, saloon.longitude))
              : null,
        };
      });

      // Trier par distance (les saloons sans distance à la fin)
      return saloonsWithDistance.sort((a, b) => {
        if (a.distanceMeters === null && b.distanceMeters === null) return 0;
        if (a.distanceMeters === null) return 1;
        if (b.distanceMeters === null) return -1;
        return a.distanceMeters - b.distanceMeters;
      });
    })
  );

  ngOnInit(): void {
    console.log('📋 ListSaloonPage - ngOnInit, connexion WebSocket...');
    this._getUserLocation();
    // Connecter au WebSocket pour les mises à jour temps réel
    this._presenceRealtimeService.connect();
    // Charger la session active de l'utilisateur (pour savoir s'il est dans un saloon)
    this._presenceService
      .getMySession()
      .pipe(takeUntil(this._destroy$))
      .subscribe({
        next: session => {
          console.log('📋 Session active chargée:', session);
        },
        error: err => {
          console.log('📋 Pas de session active ou erreur:', err);
        },
      });
  }

  ngOnDestroy(): void {
    this._destroy$.next();
    this._destroy$.complete();
  }

  private _getUserLocation(): void {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        position => {
          this.userLat = position.coords.latitude;
          this.userLng = position.coords.longitude;
          this._userPosition$.next({ lat: this.userLat, lng: this.userLng });
        },
        error => {
          console.warn('Géolocalisation non disponible:', error.message);
        }
      );
    }
  }

  private _calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371000; // Rayon de la Terre en mètres
    const dLat = this._toRad(lat2 - lat1);
    const dLng = this._toRad(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(this._toRad(lat1)) * Math.cos(this._toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private _toRad(deg: number): number {
    return deg * (Math.PI / 180);
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
      radiusMeters: saloon.radiusMeters || 50000, // Pour les tests
      distanceMeters: saloon.distanceMeters,
      connectedCount: saloon.connectedCount || saloon.visitorNumber || 0,
    };
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.selectedSaloon = null;
  }
}
