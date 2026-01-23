import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { PresenceService } from '../../services/presence.service';
import { ConfirmLeaveModalComponent } from '../confirm-leave-modal/confirm-leave-modal.component';
import { FirebaseAuthService } from 'src/app/features/auth/services/firebase-auth.service';
import { UndoLeaveService } from '../../services/undo-leave.service';

@Component({
  selector: 'app-countdown-timer',
  standalone: true,
  imports: [CommonModule, ConfirmLeaveModalComponent],
  templateUrl: './countdown-timer.component.html',
  styleUrl: './countdown-timer.component.scss',
})
export class CountdownTimerComponent implements OnInit {
  countdown: string = '';
  saloonName: string = '';
  saloonId: number | null = null;
  isVisible = false;

  // Modal de confirmation
  showConfirmModal = false;

  private _presenceService = inject(PresenceService);
  private _authService = inject(FirebaseAuthService);
  private _undoLeaveService = inject(UndoLeaveService);
  private _router = inject(Router);
  private _destroyRef = inject(DestroyRef);

  get isPremium(): boolean {
    return this._authService.currentUser()?.isPremium ?? false;
  }

  ngOnInit(): void {
    // S'abonner aux changements de temps restant
    this._presenceService.remainingSeconds$.pipe(takeUntilDestroyed(this._destroyRef)).subscribe(seconds => {
      if (seconds > 0) {
        this.countdown = this._presenceService.formatTime(seconds);
        this.isVisible = true;
      } else {
        this.countdown = '';
        this.isVisible = false;
      }
    });

    // S'abonner à la session active pour le nom du saloon
    this._presenceService.activeSession$.pipe(takeUntilDestroyed(this._destroyRef)).subscribe(session => {
      if (session) {
        this.saloonName = session.saloonName;
        this.saloonId = session.saloonId;
      } else {
        this.saloonName = '';
        this.saloonId = null;
      }
    });

    // Écouter l'expiration de la session pour rediriger
    this._presenceService.sessionExpired$.pipe(takeUntilDestroyed(this._destroyRef)).subscribe(() => {
      // Rediriger vers la liste des saloons
      this._router.navigate(['/saloons']);
    });

    // Charger la session active au démarrage
    // prettier-ignore
    this._presenceService.getMySession().pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe();
  }

  /**
   * Ouvre la modale de confirmation pour quitter le saloon.
   */
  openLeaveConfirmation(): void {
    this.showConfirmModal = true;
  }

  /**
   * Ferme la modale de confirmation.
   */
  closeConfirmModal(): void {
    this.showConfirmModal = false;
  }

  /**
   * L'utilisateur confirme vouloir quitter.
   * Lance la demande de sortie avec délai d'annulation.
   */
  onLeaveConfirmed(): void {
    this.showConfirmModal = false;

    if (!this.saloonId) return;

    const currentSaloonId = this.saloonId;

    this._presenceService
      .leaveRequest(currentSaloonId)
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe({
        next: response => {
          // Afficher le toast via le service global
          this._undoLeaveService.show(currentSaloonId, response.pendingUntil);
          // Naviguer vers la carte
          this._router.navigate(['/saloons']);
        },
        error: err => {
          console.error('Erreur lors de la demande de sortie:', err);
          // Fallback: quitter directement
          this._presenceService.clearSessionState();
          this._router.navigate(['/saloons']);
        },
      });
  }
}
