import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { HeaderComponent } from 'src/app/common/components/header/header.component';
import { FirebaseAuthService } from '../../services/firebase-auth.service';

@Component({
  selector: 'app-forgot-password-page',
  standalone: true,
  imports: [CommonModule, HeaderComponent, ReactiveFormsModule, RouterModule],
  templateUrl: './forgot-password-page.component.html',
  styleUrls: ['./forgot-password-page.component.scss'],
})
export class ForgotPasswordPageComponent implements OnInit {
  private _fb = inject(FormBuilder);
  private _auth = inject(FirebaseAuthService);
  private _router = inject(Router);
  private _route = inject(ActivatedRoute);

  private static readonly _MIN_PASSWORD_LENGTH = 8;

  resetToken = signal<string | null>(null);
  isSubmitting = signal(false);
  isEmailSent = signal(false);
  isResetSubmitted = signal(false);
  errorMessage = signal<string | null>(null);
  showNewPassword = signal(false);
  showConfirmPassword = signal(false);

  requestForm: FormGroup = this._fb.group({
    email: ['', [Validators.required, Validators.email]],
  });

  resetForm: FormGroup = this._fb.group(
    {
      newPassword: ['', [Validators.required, Validators.minLength(ForgotPasswordPageComponent._MIN_PASSWORD_LENGTH)]],
      confirmPassword: ['', [Validators.required]],
    },
    { validators: this.passwordMatchValidator }
  );

  ngOnInit(): void {
    const token = this._route.snapshot.queryParamMap.get('token');
    this.resetToken.set(token);
  }

  isResetMode(): boolean {
    return !!this.resetToken();
  }

  passwordMatchValidator(form: FormGroup): Record<string, boolean> | null {
    const newPassword = form.get('newPassword')?.value;
    const confirmPassword = form.get('confirmPassword')?.value;
    if (newPassword && confirmPassword && newPassword !== confirmPassword) {
      return { passwordMismatch: true };
    }
    return null;
  }

  isFieldInvalid(form: FormGroup, fieldName: string): boolean {
    const field = form.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }

  togglePasswordVisibility(field: 'new' | 'confirm'): void {
    if (field === 'new') {
      this.showNewPassword.update(v => !v);
    } else {
      this.showConfirmPassword.update(v => !v);
    }
  }

  sendResetEmail(): void {
    if (this.requestForm.invalid) {
      this.requestForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    const { email } = this.requestForm.value;
    this._auth.requestPasswordReset(email).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.isEmailSent.set(true);
      },
      error: (err: { error?: { message?: string } }) => {
        this.isSubmitting.set(false);
        this.errorMessage.set(err.error?.message || "Impossible d'envoyer l'email. Vérifie l'adresse.");
      },
    });
  }

  resetPassword(): void {
    if (this.resetForm.invalid) {
      this.resetForm.markAllAsTouched();
      return;
    }

    const token = this.resetToken();
    if (!token) {
      this.errorMessage.set('Lien de réinitialisation invalide.');
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    const { newPassword } = this.resetForm.value;
    this._auth.resetPassword(token, newPassword).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.isResetSubmitted.set(true);
      },
      error: (err: { error?: { message?: string } }) => {
        this.isSubmitting.set(false);
        this.errorMessage.set(err.error?.message || 'Impossible de modifier le mot de passe.');
      },
    });
  }

  goToLogin(): void {
    this._router.navigate(['/login']);
  }
}
