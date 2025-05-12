import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { RegisterProfilComponent } from '../../register-profil/register-profil.component';

@Component({
  selector: 'app-register-page',
  standalone: true,
  imports: [RouterModule, RegisterProfilComponent],
  templateUrl: './register-page.component.html',
  styleUrl: './register-page.component.scss',
})
export class RegisterPageComponent {}
