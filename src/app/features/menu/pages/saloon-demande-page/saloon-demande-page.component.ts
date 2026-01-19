import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from 'src/app/common/components/header/header.component';

@Component({
  selector: 'app-saloon-demande-page',
  standalone: true,
  imports: [CommonModule, HeaderComponent],
  templateUrl: './saloon-demande-page.component.html',
  styleUrls: ['./saloon-demande-page.component.scss'],
})
export class SaloonDemandePageComponent {}
