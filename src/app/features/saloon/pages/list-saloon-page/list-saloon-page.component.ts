import { Component, inject } from '@angular/core';
import { HeaderComponent } from '../../../../common/components/header/header.component';
import { Saloon } from '../../models/saloonModel';
import { SaloonCardComponent } from '../../components/saloon-card/saloon-card.component';
import { NavbarComponent } from 'src/app/common/components/navbar/navbar.component';
import { Router, RouterModule } from '@angular/router';
import { SwitchListMapComponent } from '../../../../common/components/switch-list-map/switch-list-map.component';
import { Observable } from 'rxjs';
import { CommonModule } from '@angular/common';
import { SaloonApiService } from '../../services/saloon-api.service';
import { HeaderReverseComponent } from '../../../../common/components/header-reverse/header-reverse.component';

@Component({
  selector: 'app-list-saloon-page',
  standalone: true,
  imports: [HeaderComponent, SaloonCardComponent, NavbarComponent, RouterModule, SwitchListMapComponent, CommonModule, HeaderReverseComponent],
  templateUrl: './list-saloon-page.component.html',
  styleUrl: './list-saloon-page.component.scss',
})
export class ListSaloonPageComponent {
  isMapView = false;

  private _router = inject(Router);
  private _saloonApiService = inject(SaloonApiService);

  saloons$: Observable<Saloon[]> = this._saloonApiService.getListSaloon();

  toggleView(event: any): void {
    this.isMapView = event.target.checked;

    if (this.isMapView) {
      this._router.navigate(['/map']);
    } else {
      this._router.navigate(['/saloons']);
    }
  }
}
