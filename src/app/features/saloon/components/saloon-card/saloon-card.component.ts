import { Component, inject, Input, OnInit, OnDestroy, OnChanges, SimpleChanges } from '@angular/core';
import { Saloon } from '../../models/saloonModel';
import { CommonModule } from '@angular/common';
import { PresenceService } from '../../services/presence.service';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-saloon-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './saloon-card.component.html',
  styleUrl: './saloon-card.component.scss',
})
export class SaloonCardComponent implements OnInit, OnDestroy, OnChanges {
  @Input() saloon!: Saloon;
  @Input() distanceMeters: number | null = null;

  // Propriété calculée (mise à jour uniquement quand nécessaire)
  visitorCount = 0;

  private _presenceService = inject(PresenceService);
  private _destroy$ = new Subject<void>();
  private _myActiveSaloonId: number | null = null;

  ngOnInit(): void {
    // S'abonner à la session active pour savoir si on est dans ce saloon
    this._presenceService.activeSession$.pipe(takeUntil(this._destroy$)).subscribe(session => {
      this._myActiveSaloonId = session?.saloonId ?? null;
      this._updateVisitorCount();
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['saloon']) {
      this._updateVisitorCount();
    }
  }

  ngOnDestroy(): void {
    this._destroy$.next();
    this._destroy$.complete();
  }

  /**
   * Met à jour le nombre de visiteurs (appelé uniquement quand les données changent)
   */
  private _updateVisitorCount(): void {
    if (!this.saloon) return;
    // Priorité à connectedCount (Redis temps réel) puis visitorNumber (BDD)
    const count = this.saloon.connectedCount ?? this.saloon.visitorNumber ?? 0;
    // Si je suis dans ce saloon, ne pas me compter
    const isInThisSaloon = this._myActiveSaloonId === this.saloon.id;
    this.visitorCount = isInThisSaloon && count > 0 ? count - 1 : count;
  }

  get formattedDistance(): string {
    if (this.distanceMeters === null) return '';
    if (this.distanceMeters < 1000) {
      return `${this.distanceMeters}m`;
    }
    return `${(this.distanceMeters / 1000).toFixed(1)}km`;
  }
}
