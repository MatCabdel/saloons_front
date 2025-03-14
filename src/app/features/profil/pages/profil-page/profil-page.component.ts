import { Component } from '@angular/core';
import { NavbarComponent } from 'src/app/common/components/navbar/navbar.component';

@Component({
  selector: 'app-profil-page',
  standalone: true,
  imports: [NavbarComponent],
  templateUrl: './profil-page.component.html',
  styleUrl: './profil-page.component.scss',
})
export class ProfilPageComponent {}
