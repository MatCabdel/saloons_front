import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { PresenceService } from '../../services/presence.service';

@Component({
  selector: 'app-countdown-timer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './countdown-timer.component.html',
  styleUrl: './countdown-timer.component.scss',
})
export class CountdownTimerComponent implements OnInit {
  countdown: string = '';
  saloonName: string = '';
  isVisible = false;

  private _presenceService = inject(PresenceService);
  private _router = inject(Router);
  private _destroyRef = inject(DestroyRef);

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
      } else {
        this.saloonName = '';
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
   * Quitter le saloon actuel.
   */
  leaveSaloon(): void {
    this._presenceService
      .leaveCurrentSession()
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe(() => {
        this._router.navigate(['/saloons']);
      });
  }
}
