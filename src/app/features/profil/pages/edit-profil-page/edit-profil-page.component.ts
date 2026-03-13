import { Component } from '@angular/core';
import { HeaderComponent } from 'src/app/common/components/header/header.component';
import { NavbarComponent } from 'src/app/common/components/navbar/navbar.component';
import { EditProfilComponent } from '../../components/edit-profil/edit-profil.component';

@Component({
  selector: 'app-edit-profil-page',
  standalone: true,
  imports: [EditProfilComponent, HeaderComponent, NavbarComponent],
  templateUrl: './edit-profil-page.component.html',
  styleUrl: './edit-profil-page.component.scss',
})
export class EditProfilPageComponent {}
