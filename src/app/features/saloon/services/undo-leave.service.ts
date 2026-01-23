import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type UndoLeaveState = {
  isVisible: boolean;
  saloonId: number | null;
  pendingUntil: number;
};

@Injectable({
  providedIn: 'root',
})
export class UndoLeaveService {
  private _state$ = new BehaviorSubject<UndoLeaveState>({
    isVisible: false,
    saloonId: null,
    pendingUntil: 0,
  });

  state$ = this._state$.asObservable();

  /**
   * Affiche le toast d'annulation.
   */
  show(saloonId: number, pendingUntil: number): void {
    this._state$.next({
      isVisible: true,
      saloonId,
      pendingUntil,
    });
  }

  /**
   * Cache le toast.
   */
  hide(): void {
    this._state$.next({
      isVisible: false,
      saloonId: null,
      pendingUntil: 0,
    });
  }

  /**
   * Récupère l'état actuel.
   */
  getState(): UndoLeaveState {
    return this._state$.value;
  }
}
