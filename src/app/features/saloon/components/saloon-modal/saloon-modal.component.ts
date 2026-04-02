import {
  Component,
  EventEmitter,
  inject,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { PresenceService, SaloonMapItem, ActiveSession } from '../../services/presence.service';
import { PresenceWebSocketService } from '../../services/presence-websocket.service';
import { SaloonPresenceRealtimeService } from '../../services/saloon-presence-realtime.service';
import { SALOON_TYPE_LABELS } from '../../models/saloonModel';
import { ConfirmLeaveModalComponent } from '../confirm-leave-modal/confirm-leave-modal.component';
import { FirebaseAuthService } from 'src/app/features/auth/services/firebase-auth.service';
import { AuthApiService } from 'src/app/features/auth/services/auth-api.service';
import { EventApiService } from 'src/app/features/event/services/event-api.service';

/** Informations optionnelles d'un événement à afficher dans la modale saloon. */
export type EventInfoForModal = {
  title: string;
  subTitle?: string;
  imageUrl?: string;
  description?: string;
  startDateTime: string;
  eventId?: number;
  interestedCount?: number;
  isInterested?: boolean;
};

@Component({
  selector: 'app-saloon-modal',
  standalone: true,
  imports: [CommonModule, ConfirmLeaveModalComponent],
  templateUrl: './saloon-modal.component.html',
  styleUrl: './saloon-modal.component.scss',
})
export class SaloonModalComponent implements OnInit, OnDestroy, OnChanges {
  @Input() saloon: SaloonMapItem | null = null;
  @Input() userLat: number | null = null;
  @Input() userLng: number | null = null;
  @Input() geoLocationStatus: 'prompt' | 'loading' | 'granted' | 'denied' | 'unavailable' =
    'prompt';
  /** Données événement optionnelles – si renseignées, la modale affiche les infos événement au-dessus du saloon. */
  @Input() eventInfo: EventInfoForModal | null = null;
  @Output() closed = new EventEmitter<void>();
  @Output() requestLocation = new EventEmitter<void>();

  isLoading = false;
  errorMessage = '';
  activeSession: ActiveSession | null = null;
  isInThisSaloon = false;
  realConnectedCount: number | null = null;

  // Modal de confirmation de sortie
  showConfirmLeaveModal = false;

  private _destroy$ = new Subject<void>();
  private _presenceService = inject(PresenceService);
  private _presenceWsService = inject(PresenceWebSocketService);
  private _presenceRealtimeService = inject(SaloonPresenceRealtimeService);
  private _authService = inject(FirebaseAuthService);
  private _authApiService = inject(AuthApiService);
  private _eventApiService = inject(EventApiService);
  private _router = inject(Router);

  get isPremium(): boolean {
    return this._authService.currentUser()?.isPremium ?? false;
  }

  get isLocationGranted(): boolean {
    return this.geoLocationStatus === 'granted';
  }

  get isLocationBlocked(): boolean {
    return this.geoLocationStatus === 'denied' || this.geoLocationStatus === 'unavailable';
  }

  get locationStatusMessage(): string {
    switch (this.geoLocationStatus) {
      case 'loading':
        return 'Recherche de votre position...';
      case 'denied':
        return 'La géolocalisation est désactivée. Activez-la pour entrer.';
      case 'unavailable':
        return 'Position indisponible. Activez la géolocalisation pour entrer.';
      case 'prompt':
        return 'Activez la localisation pour entrer dans un saloon.';
      default:
        return '';
    }
  }

  get isReviewerOrAdmin(): boolean {
    const roles = this._authApiService.getUserRoles();
    return roles.includes('ROLE_REVIEWER') || roles.includes('ROLE_ADMIN');
  }

  get canJoinWithoutLocation(): boolean {
    return this.isReviewerOrAdmin && this.saloon?.isPrivate === true;
  }

  ngOnInit(): void {
    // Vérifier si l'utilisateur a déjà une session
    this._presenceService.activeSession$.pipe(takeUntil(this._destroy$)).subscribe(session => {
      this.activeSession = session;
      this.isInThisSaloon = session?.saloonId === this.saloon?.id;
    });

    // S'abonner aux mises à jour temps réel de la présence
    this._presenceRealtimeService.presenceCounts$
      .pipe(takeUntil(this._destroy$))
      .subscribe(counts => {
        if (this.saloon) {
          const realtimeCount = counts.get(this.saloon.id);
          if (realtimeCount !== undefined) {
            this.realConnectedCount = realtimeCount;
          }
        }
      });

    // Charger la session active au démarrage
    // prettier-ignore
    this._presenceService.ensureMySessionLoaded().pipe(takeUntil(this._destroy$))
      .subscribe();

    // Charger le nombre réel de connectés
    this._loadConnectedCount();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['saloon'] && this.saloon) {
      this._loadConnectedCount();
    }
  }

  ngOnDestroy(): void {
    this._destroy$.next();
    this._destroy$.complete();
  }

  /**
   * Charge le nombre réel d'utilisateurs connectés au saloon via Redis/Presence
   */
  private _loadConnectedCount(): void {
    if (!this.saloon) return;

    this._presenceService
      .getPresence(this.saloon.id)
      .pipe(takeUntil(this._destroy$))
      .subscribe({
        next: presence => {
          this.realConnectedCount = presence.connectedCount;
        },
        error: () => {
          // En cas d'erreur, utiliser la valeur du saloon
          this.realConnectedCount = this.saloon?.connectedCount || 0;
        },
      });
  }

  /**
   * Retourne le nombre de connectés à afficher (sans se compter) (sans se compter)
   */
  get connectedCount(): number {
    const count = this.realConnectedCount ?? this.saloon?.connectedCount ?? 0;
    // Si je suis dans ce saloon, ne pas me compter
    if (this.isInThisSaloon && count > 0) {
      return count - 1;
    }
    return count;
  }

  /**
   * Ferme le modal.
   */
  close(): void {
    this.closed.emit();
  }

  /**
   * Toggle l'intérêt pour l'événement affiché.
   */
  onToggleInterest(): void {
    if (!this.eventInfo?.eventId) return;
    this._eventApiService.toggleInterest(this.eventInfo.eventId).subscribe({
      next: res => {
        if (this.eventInfo) {
          this.eventInfo = {
            ...this.eventInfo,
            isInterested: res.interested,
            interestedCount: res.interestedCount,
          };
        }
      },
    });
  }

  /**
   * Rejoindre le saloon.
   */
  joinSaloon(): void {
    if (!this.saloon) return;

    this.isLoading = true;
    this.errorMessage = '';

    this._presenceService
      .joinSaloon(this.saloon.id, this.userLat, this.userLng)
      .pipe(takeUntil(this._destroy$))
      .subscribe({
        next: () => {
          this.isLoading = false;
          // Se connecter au WebSocket pour la présence
          this._presenceWsService.connect(this.saloon!.id);
          // Naviguer vers la page du saloon (mysaloon)
          this._router.navigate(['/mysaloon', this.saloon!.id]);
          this.close();
        },
        error: err => {
          this.isLoading = false;
          this.errorMessage = err.error?.error || 'Une erreur est survenue';
        },
      });
  }

  requestGeolocation(): void {
    this.requestLocation.emit();
  }

  openLocationSettings(): void {
    window.location.href = 'app-settings:';
  }

  /**
   * Revenir au saloon (sans rejoindre, juste naviguer)
   */
  goToSaloon(): void {
    if (!this.activeSession) return;
    this._router.navigate(['/mysaloon', this.activeSession.saloonId]);
    this.close();
  }

  /**
   * Ouvre la modale de confirmation pour quitter le saloon.
   */
  openLeaveConfirmation(): void {
    this.showConfirmLeaveModal = true;
  }

  /**
   * Ferme la modale de confirmation.
   */
  closeConfirmLeaveModal(): void {
    this.showConfirmLeaveModal = false;
  }

  /**
   * L'utilisateur confirme vouloir quitter.
   */
  onLeaveConfirmed(): void {
    this.showConfirmLeaveModal = false;
    if (!this.activeSession) return;

    const saloonId = this.activeSession.saloonId;
    this.isLoading = true;
    this._presenceService
      .leaveSaloon(saloonId)
      .pipe(takeUntil(this._destroy$))
      .subscribe({
        next: () => {
          this.isLoading = false;
          this._presenceWsService.disconnect();
          this.close();
        },
        error: err => {
          this.isLoading = false;
          this.errorMessage = err.error?.error || 'Une erreur est survenue';
        },
      });
  }

  /**
   * Quitter le saloon actuel (ancienne méthode, garde pour compatibilité si besoin).
   * @deprecated Utiliser openLeaveConfirmation() à la place
   */
  leaveSaloon(): void {
    this.openLeaveConfirmation();
  }

  /**
   * Vérifier si l'utilisateur est trop loin.
   * TODO: Remettre la vraie logique après les tests
   */
  get isTooFar(): boolean {
    // Temporairement désactivé pour les tests
    // Si pas de position utilisateur, on autorise l'entrée (le backend validera)
    if (!this.saloon || !this.saloon.distanceMeters || !this.saloon.radiusMeters) {
      return false;
    }
    if (this.saloon.isPrivate === true && this.isReviewerOrAdmin) {
      return false;
    }
    return this.saloon.distanceMeters > this.saloon.radiusMeters;
  }

  /**
   * Message de distance.
   */
  get distanceMessage(): string {
    if (!this.saloon?.distanceMeters) return '';
    if (this.saloon.distanceMeters < 1000) {
      return `À ${this.saloon.distanceMeters}m`;
    }
    return `À ${(this.saloon.distanceMeters / 1000).toFixed(1)}km`;
  }

  /**
   * Vérifie si l'utilisateur a une session dans un autre saloon.
   */
  get hasSessionElsewhere(): boolean {
    return this.activeSession !== null && !this.isInThisSaloon;
  }

  /**
   * Retourne le label du type de saloon.
   */
  get typeLabel(): string {
    if (!this.saloon?.type) return '';
    return SALOON_TYPE_LABELS[this.saloon.type] || '';
  }
}
