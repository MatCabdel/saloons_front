import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';

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

  toggleView(event: any): void {
    this.isMapView = event.target.checked;

    if (this.isMapView) {
      this._router.navigate(['/map']);
    } else {
      this._router.navigate(['/saloons']);
    }
  }
}
