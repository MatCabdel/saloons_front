import { Component, OnInit } from '@angular/core';
import { HeaderComponent } from '../../../../common/components/header/header.component';
import { HttpClient } from '@angular/common/http';
import { Saloon } from '../../models/saloonModel';
import { SaloonCardComponent } from '../../components/saloon-card/saloon-card.component';

@Component({
  selector: 'app-list-saloon-page',
  standalone: true,
  imports: [HeaderComponent, SaloonCardComponent],
  templateUrl: './list-saloon-page.component.html',
  styleUrl: './list-saloon-page.component.scss',
})
export class ListSaloonPageComponent implements OnInit {
  isMapView = false;
  saloons: Saloon[] = [];

  constructor(private _http: HttpClient) {}

  toggleView(event: any): void {
    this.isMapView = event.target.checked;
    console.log('Vue actuelle :', this.isMapView ? 'Carte' : 'Liste');
  }

  ngOnInit(): void {
    this._http.get<Saloon[]>('http://localhost:3000/places').subscribe((data: Saloon[]) => {
      this.saloons = data;
    });
  }
}
