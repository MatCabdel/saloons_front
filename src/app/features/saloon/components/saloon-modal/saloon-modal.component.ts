import { Component, EventEmitter, inject, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { PresenceService, SaloonMapItem, ActiveSession } from '../../services/presence.service';
import { PresenceWebSocketService } from '../../services/presence-websocket.service';

@Component({
  selector: 'app-saloon-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './saloon-modal.component.html',
  styleUrl: './saloon-modal.component.scss',
})
export class SaloonModalComponent implements OnInit, OnDestroy, OnChanges {
  @Input() saloon: SaloonMapItem | null = null;
  @Input() userLat: number | null = null;
  @Input() userLng: number | null = null;
  @Output() closed = new EventEmitter<void>();

  isLoading = false;
  errorMessage = '';
  activeSession: ActiveSession | null = null;
  isInThisSaloon = false;
  realConnectedCount: number | null = null;

  private _destroy$ = new Subject<void>();
  private _presenceService = inject(PresenceService);
  private _presenceWsService = inject(PresenceWebSocketService);
  private _router = inject(Router);

  ngOnInit(): void {
    // Vérifier si l'utilisateur a déjà une session
    this._presenceService.activeSession$.pipe(takeUntil(this._destroy$)).subscribe(session => {
      this.activeSession = session;
      this.isInThisSaloon = session?.saloonId === this.saloon?.id;
    });

    // Charger la session active au démarrage
    this._presenceService
      .getMySession()
      .pipe(takeUntil(this._destroy$))
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
   * Retourne le nombre de connectés à afficher
   */
  get connectedCount(): number {
    return this.realConnectedCount ?? this.saloon?.connectedCount ?? 0;
  }

  /**
   * Ferme le modal.
   */
  close(): void {
    this.closed.emit();
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

  /**
   * Revenir au saloon (sans rejoindre, juste naviguer)
   */
  goToSaloon(): void {
    if (!this.activeSession) return;
    this._router.navigate(['/mysaloon', this.activeSession.saloonId]);
    this.close();
  }

  /**
   * Quitter le saloon actuel.
   */
  leaveSaloon(): void {
    if (!this.activeSession) return;

    this.isLoading = true;
    this._presenceService
      .leaveSaloon(this.activeSession.saloonId)
      .pipe(takeUntil(this._destroy$))
      .subscribe({
        next: () => {
          this.isLoading = false;
          this._presenceWsService.disconnect();
        },
        error: err => {
          this.isLoading = false;
          this.errorMessage = err.error?.error || 'Une erreur est survenue';
        },
      });
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
}
