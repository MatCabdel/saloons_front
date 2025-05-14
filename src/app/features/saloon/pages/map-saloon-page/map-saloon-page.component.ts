import { Component, inject } from '@angular/core';
import { HeaderComponent } from '../../../../common/components/header/header.component';
import { NavbarComponent } from 'src/app/common/components/navbar/navbar.component';
import { Router } from '@angular/router';
import { MapComponent } from '../../components/map/map.component';
import { SwitchListMapComponent } from '../../../../common/components/switch-list-map/switch-list-map.component';
import { HeaderReverseComponent } from '../../../../common/components/header-reverse/header-reverse.component';

@Component({
  selector: 'app-map-saloon-page',
  standalone: true,
  imports: [HeaderComponent, NavbarComponent, MapComponent, SwitchListMapComponent, HeaderReverseComponent],
  templateUrl: './map-saloon-page.component.html',
  styleUrl: './map-saloon-page.component.scss',
})
export class MapSaloonPageComponent {
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
