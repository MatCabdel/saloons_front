import { Component } from '@angular/core';
import { MapComponent } from '../../components/map/map.component';

@Component({
  selector: 'app-map-saloon-page',
  standalone: true,
  imports: [MapComponent],
  templateUrl: './map-saloon-page.component.html',
  styleUrl: './map-saloon-page.component.scss',
})
export class MapSaloonPageComponent {}
