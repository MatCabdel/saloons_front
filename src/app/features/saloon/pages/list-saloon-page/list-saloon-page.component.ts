import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';
import { Saloon } from '../../models/saloonModel';
import { SaloonCardComponent } from '../../components/saloon-card/saloon-card.component';
import { SaloonApiService } from '../../services/saloon-api.service';

@Component({
  selector: 'app-list-saloon-page',
  standalone: true,
  imports: [CommonModule, SaloonCardComponent],
  templateUrl: './list-saloon-page.component.html',
  styleUrl: './list-saloon-page.component.scss',
})
export class ListSaloonPageComponent {
  private _saloonApiService = inject(SaloonApiService);

  saloons$: Observable<Saloon[]> = this._saloonApiService.getListSaloon();
}
