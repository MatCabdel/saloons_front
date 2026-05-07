import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { NavbarComponent } from 'src/app/common/components/navbar/navbar.component';
import { EditProfilComponent } from '../../components/edit-profil/edit-profil.component';

@Component({
  selector: 'app-edit-profil-page',
  standalone: true,
  imports: [EditProfilComponent, NavbarComponent],
  templateUrl: './edit-profil-page.component.html',
  styleUrl: './edit-profil-page.component.scss',
})
export class EditProfilPageComponent {
  private _router = inject(Router);

  goBack(): void {
    this._router.navigate(['/profil']);
  }
}
