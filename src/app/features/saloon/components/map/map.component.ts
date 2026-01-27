import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import * as L from 'leaflet';
import { Subject, takeUntil } from 'rxjs';
import { SaloonModalComponent } from '../saloon-modal/saloon-modal.component';
import { SaloonMapItem } from '../../services/presence.service';
import { SaloonApiService } from '../../services/saloon-api.service';
import { Saloon } from '../../models/saloonModel';

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
    this._getUserLocation();
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
      radiusMeters: saloon.radiusMeters || 50000, // 50km pour les tests
      distanceMeters: null,
      connectedCount: saloon.visitorNumber || saloon.visitors || 0,
      type: saloon.type,
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

  private _getUserLocation(): void {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        position => {
          this.userLat = position.coords.latitude;
          this.userLng = position.coords.longitude;

          // Mettre à jour les distances
          this._updateDistances();

          // Ajouter le marqueur de position utilisateur
          this._addUserMarker();

          // Centrer la carte sur l'utilisateur
          this.map.setView([this.userLat, this.userLng], 15);
        },
        error => {
          console.warn('Géolocalisation non disponible:', error.message);
        }
      );
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
      this.map.setView([this.userLat, this.userLng], 15);
    } else {
      // Si pas de position, demander à nouveau
      this._getUserLocation();
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
}
