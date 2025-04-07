import { Component, OnInit } from '@angular/core';
import * as L from 'leaflet';

@Component({
  selector: 'app-map',
  standalone: true,
  imports: [],
  templateUrl: './map.component.html',
  styleUrl: './map.component.scss'
})
export class MapComponent implements OnInit {


  map: any;
  private _markers: L.Marker[] = [];

  private _customIcon = L.icon({
    iconUrl: 'assets/icons/mapmarker.svg',
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -40] 
  });
  

  ngOnInit(): void {
    this.configMap();
  }

  configMap(): void {
    this.map = L.map('map', {
      center: [44.837789, -0.57918], 
      zoom: 14
    });
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(this.map);
  this._addMarkers();
  }

  private _addMarkers(): void {
    const locations = [
      { lat: 44.841162, lng: -0.58192, name: "L'Engrenage", url: "/saloon/engrenage" },
      { lat: 44.838357, lng: -0.575559, name: "Le Magnus", url: "/saloon/magnus" },
      { lat: 44.838929, lng: -0.568325, name: "Le Vintage Café", url: "/saloon/vintage" },
    ];
    locations.forEach(loc => {
      const popupContent = `
        <div>
          <strong>${loc.name}</strong><br>
          <a href="${loc.url}" style="color: blue; text-decoration: underline;">Voir la page</a>
        </div>
      `;
      const marker = L.marker([loc.lat, loc.lng], { icon: this._customIcon }).addTo(this.map)
      .bindPopup(popupContent);

    this._markers.push(marker);
  });
}
}