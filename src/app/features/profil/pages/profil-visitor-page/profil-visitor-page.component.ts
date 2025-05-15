import { Component } from '@angular/core';
import { NavbarComponent } from '../../../../common/components/navbar/navbar.component';
import { VisitorProfilComponent } from '../../components/visitor-profil/visitor-profil.component';

@Component({
  selector: 'app-profil-visitor-page',
  standalone: true,
  imports: [NavbarComponent, VisitorProfilComponent],
  templateUrl: './profil-visitor-page.component.html',
  styleUrl: './profil-visitor-page.component.scss',
})
export class ProfilVisitorPageComponent {}
