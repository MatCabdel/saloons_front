import { Component, Input } from '@angular/core';
import { Saloon } from '../../models/saloonModel';

@Component({
  selector: 'app-saloon-card',
  standalone: true,
  imports: [],
  templateUrl: './saloon-card.component.html',
  styleUrl: './saloon-card.component.scss',
})
export class SaloonCardComponent {
  @Input() saloon!: Saloon;
}
