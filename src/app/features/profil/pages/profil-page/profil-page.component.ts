import { Component } from '@angular/core';
import { NavbarComponent } from 'src/app/common/components/navbar/navbar.component';
import { MyProfilComponent } from '../../components/my-profil/my-profil.component';

@Component({
  selector: 'app-profil-page',
  standalone: true,
  imports: [NavbarComponent, MyProfilComponent],
  templateUrl: './profil-page.component.html',
  styleUrl: './profil-page.component.scss',
})
export class ProfilPageComponent {}
