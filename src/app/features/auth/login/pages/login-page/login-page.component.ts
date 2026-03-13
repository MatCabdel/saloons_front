import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { LoginFormComponent } from '../../components/login-form/login-form.component';
import { HeaderComponent } from 'src/app/common/components/header/header.component';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [LoginFormComponent, RouterModule, HeaderComponent],
  templateUrl: './login-page.component.html',
  styleUrl: './login-page.component.scss',
})
export class LoginPageComponent {}
