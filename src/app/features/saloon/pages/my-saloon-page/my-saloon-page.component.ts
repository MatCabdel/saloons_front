import { Component } from '@angular/core';
import { NavbarComponent } from '../../../../common/components/navbar/navbar.component';

@Component({
  selector: 'app-my-saloon-page',
  standalone: true,
  imports: [NavbarComponent],
  templateUrl: './my-saloon-page.component.html',
  styleUrl: './my-saloon-page.component.scss',
})
export class MySaloonPageComponent {}
