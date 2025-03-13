import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthApiService } from '../../../services/auth-api.service';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login-form',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './login-form.component.html',
  styleUrl: './login-form.component.scss',
})
export class LoginFormComponent {
  private _formBuilder = inject(FormBuilder);
  private _authService = inject(AuthApiService);
  private _router = inject(Router);

  loginForm = this._formBuilder.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });

  login(): void {
    const { email, password } = this.loginForm.value;
  
    this._authService.login$(email!, password!).subscribe({
      next: () => {
        const role = this._authService.getUserRole();
        if (role === 'ROLE_ADMIN') {
          this._router.navigate(['/dashboard']);
        } else {
          this._router.navigate(['/saloons']);
        }
      },
      error: (err) => {
        console.error('Erreur lors de la connexion :', err);
      }
    });
  }
}
