import { Component } from '@angular/core';
import { EditProfilComponent } from '../../components/edit-profil/edit-profil.component';

@Component({
  selector: 'app-edit-profil-page',
  standalone: true,
  imports: [EditProfilComponent],
  templateUrl: './edit-profil-page.component.html',
  styleUrl: './edit-profil-page.component.scss',
})
export class EditProfilPageComponent {}
