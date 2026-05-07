import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { NavbarComponent } from 'src/app/common/components/navbar/navbar.component';
import { MyProfilComponent } from '../../components/my-profil/my-profil.component';

@Component({
  selector: 'app-profil-page',
  standalone: true,
  imports: [NavbarComponent, MyProfilComponent],
  templateUrl: './profil-page.component.html',
  styleUrl: './profil-page.component.scss',
})
export class ProfilPageComponent {
  private _router = inject(Router);

  goBack(): void {
    this._router.navigate(['/mon-compte']);
  }
}
