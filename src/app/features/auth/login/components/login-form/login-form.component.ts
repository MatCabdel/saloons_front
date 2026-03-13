import { Component, DestroyRef, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthApiService } from '../../../services/auth-api.service';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { UserStoreService } from 'src/app/features/user/store/user-store.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

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
  private _userStore = inject(UserStoreService);
  private _destroyRef = inject(DestroyRef);

  loginForm = this._formBuilder.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });

  login(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }
    const { email, password } = this.loginForm.value;

    this._authService
      .login$(email!, password!)
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe({
        next: userDTO => {
          this._userStore.setUserConnected(userDTO);
          const role = this._authService.getUserRole();
          if (role === 'ROLE_ADMIN') {
            this._router.navigate(['/dashboard']);
          } else {
            this._router.navigate(['/saloons']);
          }
        },
      });
  }
}
