import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { RegisterProfilComponent } from '../../register-profil/register-profil.component';
import { HeaderComponent } from 'src/app/common/components/header/header.component';

@Component({
  selector: 'app-register-page',
  standalone: true,
  imports: [RouterModule, RegisterProfilComponent, HeaderComponent],
  templateUrl: './register-page.component.html',
  styleUrl: './register-page.component.scss',
})
export class RegisterPageComponent {}
