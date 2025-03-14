import { Component, inject, OnInit } from '@angular/core';
import { HeaderComponent } from '../../../../common/components/header/header.component';
import { HttpClient } from '@angular/common/http';
import { Saloon } from '../../models/saloonModel';
import { SaloonCardComponent } from '../../components/saloon-card/saloon-card.component';
import { NavbarComponent } from 'src/app/common/components/navbar/navbar.component';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-list-saloon-page',
  standalone: true,
  imports: [HeaderComponent, SaloonCardComponent, NavbarComponent, RouterModule],
  templateUrl: './list-saloon-page.component.html',
  styleUrl: './list-saloon-page.component.scss',
})
export class ListSaloonPageComponent implements OnInit {
  isMapView = false;
  saloons: Saloon[] = [];

  private _http = inject(HttpClient);
  private _router = inject(Router)

  toggleView(event: any): void {
    this.isMapView = event.target.checked;

    if (this.isMapView) {
      this._router.navigate(['/map']);
    } else {
      this._router.navigate(['/saloons']);
    }
    console.log('Vue actuelle :', this.isMapView ? 'Carte' : 'Liste');
  }

  ngOnInit(): void {
    this._http.get<Saloon[]>('http://localhost:3000/places').subscribe((data: Saloon[]) => {
      this.saloons = data;
    });
  }
}
