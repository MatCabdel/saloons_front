import { Component, DestroyRef, inject } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-switch-list-map',
  standalone: true,
  imports: [],
  templateUrl: './switch-list-map.component.html',
  styleUrl: './switch-list-map.component.scss',
})
export class SwitchListMapComponent {
  isMapView = false;
  private _router = inject(Router);
  private _destroyRef = inject(DestroyRef);

  constructor() {
    this.isMapView = this._router.url.includes('/map');
    this._router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed(this._destroyRef)
      )
      .subscribe(event => {
        this.isMapView = event.urlAfterRedirects.includes('/map');
      });
  }

  toggleView(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    if (checked === this.isMapView) {
      return;
    }
    this.isMapView = checked;
    const targetTree = this._router.createUrlTree(checked ? ['/saloons', 'map'] : ['/saloons']);
    this._router.navigateByUrl(targetTree);
  }
}
