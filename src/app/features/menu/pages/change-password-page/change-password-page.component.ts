import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { HeaderComponent } from 'src/app/common/components/header/header.component';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-change-password-page',
  standalone: true,
  imports: [CommonModule, HeaderComponent, ReactiveFormsModule, RouterModule],
  templateUrl: './change-password-page.component.html',
  styleUrls: ['./change-password-page.component.scss'],
})
export class ChangePasswordPageComponent {
  private _fb = inject(FormBuilder);
  private _http = inject(HttpClient);
  private _router = inject(Router);

  private static readonly _MIN_PASSWORD_LENGTH = 8;

  isSubmitting = signal(false);
  isSubmitted = signal(false);
  errorMessage = signal<string | null>(null);
  showCurrentPassword = signal(false);
  showNewPassword = signal(false);
  showConfirmPassword = signal(false);

  form: FormGroup = this._fb.group(
    {
      currentPassword: ['', [Validators.required]],
      newPassword: [
        '',
        [
          Validators.required,
          Validators.minLength(ChangePasswordPageComponent._MIN_PASSWORD_LENGTH),
        ],
      ],
      confirmPassword: ['', [Validators.required]],
    },
    { validators: this.passwordMatchValidator }
  );

  passwordMatchValidator(form: FormGroup): Record<string, boolean> | null {
    const newPassword = form.get('newPassword')?.value;
    const confirmPassword = form.get('confirmPassword')?.value;
    if (newPassword && confirmPassword && newPassword !== confirmPassword) {
      return { passwordMismatch: true };
    }
    return null;
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.form.get(fieldName);
    return field ? field.invalid && field.touched : false;
  }

  togglePasswordVisibility(field: 'current' | 'new' | 'confirm'): void {
    switch (field) {
      case 'current':
        this.showCurrentPassword.update(v => !v);
        break;
      case 'new':
        this.showNewPassword.update(v => !v);
        break;
      case 'confirm':
        this.showConfirmPassword.update(v => !v);
        break;
    }
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    const { currentPassword, newPassword } = this.form.value;

    this._http
      .post(`${environment.apiUrl}/user/change-password`, {
        currentPassword,
        newPassword,
      })
      .subscribe({
        next: () => {
          this.isSubmitting.set(false);
          this.isSubmitted.set(true);
        },
        error: (err: { error?: { message?: string } }) => {
          this.isSubmitting.set(false);
          this.errorMessage.set(
            err.error?.message || 'Une erreur est survenue. Vérifie ton mot de passe actuel.'
          );
        },
      });
  }

  goBack(): void {
    this._router.navigate(['/mon-compte']);
  }
}
