import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class PanelService {
  private _isOpen$ = new BehaviorSubject<boolean>(false);

  get isOpen$(): Observable<boolean> {
    return this._isOpen$.asObservable();
  }

  open(): void {
    this._isOpen$.next(true);
  }

  close(): void {
    this._isOpen$.next(false);
  }
}
