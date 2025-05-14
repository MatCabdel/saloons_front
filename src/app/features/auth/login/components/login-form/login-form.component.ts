import { Component, inject, OnDestroy } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthApiService } from '../../../services/auth-api.service';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { UserStoreService } from 'src/app/features/user/store/user-store.service';

@Component({
  selector: 'app-login-form',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './login-form.component.html',
  styleUrl: './login-form.component.scss',
})
export class LoginFormComponent implements OnDestroy {
  private _formBuilder = inject(FormBuilder);
  private _authService = inject(AuthApiService);
  private _router = inject(Router);
  private _destroy$ = new Subject<void>();
  private _userStore = inject(UserStoreService);

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
      .pipe(takeUntil(this._destroy$))
      .subscribe({
        next: (userDTO) => {
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

  ngOnDestroy(): void {
    this._destroy$.next();
    this._destroy$.complete();
  }
}
