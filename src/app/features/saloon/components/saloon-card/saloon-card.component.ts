import { Component, inject, Input, OnInit, OnDestroy } from '@angular/core';
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
export class SaloonCardComponent implements OnInit, OnDestroy {
  @Input() saloon!: Saloon;
  @Input() distanceMeters: number | null = null;

  private _presenceService = inject(PresenceService);
  private _destroy$ = new Subject<void>();
  private _myActiveSaloonId: number | null = null;

  ngOnInit(): void {
    // S'abonner à la session active pour savoir si on est dans ce saloon
    this._presenceService.activeSession$.pipe(takeUntil(this._destroy$)).subscribe(session => {
      this._myActiveSaloonId = session?.saloonId ?? null;
      console.log('🎴 Card', this.saloon.name, '- myActiveSaloonId:', this._myActiveSaloonId, 'saloon.id:', this.saloon.id);
    });
  }

  ngOnDestroy(): void {
    this._destroy$.next();
    this._destroy$.complete();
  }

  /**
   * Retourne le nombre de visiteurs à afficher (sans se compter)
   */
  get visitorCount(): number {
    // Priorité à connectedCount (Redis temps réel) puis visitorNumber (BDD)
    const count = this.saloon.connectedCount ?? this.saloon.visitorNumber ?? 0;
    // Si je suis dans ce saloon, ne pas me compter
    const isInThisSaloon = this._myActiveSaloonId === this.saloon.id;
    console.log('🔢 visitorCount for', this.saloon.name, '- count:', count, 'isInThisSaloon:', isInThisSaloon, 'myActiveSaloonId:', this._myActiveSaloonId);
    if (isInThisSaloon && count > 0) {
      return count - 1;
    }
    return count;
  }

  get formattedDistance(): string {
    if (this.distanceMeters === null) return '';
    if (this.distanceMeters < 1000) {
      return `${this.distanceMeters}m`;
    }
    return `${(this.distanceMeters / 1000).toFixed(1)}km`;
  }
}
