import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { HeaderComponent } from 'src/app/common/components/header/header.component';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-public-delete-account-page',
  standalone: true,
  imports: [CommonModule, HeaderComponent, ReactiveFormsModule, RouterModule],
  templateUrl: './public-delete-account-page.component.html',
  styleUrl: './public-delete-account-page.component.scss',
})
export class PublicDeleteAccountPageComponent {
  private readonly _fb = inject(FormBuilder);
  private readonly _http = inject(HttpClient);

  isSubmitting = signal(false);
  isSubmitted = signal(false);
  errorMessage = signal<string | null>(null);

  form = this._fb.group({
    firstName: ['', [Validators.required, Validators.minLength(2)]],
    lastName: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    message: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(2000)]],
    confirmRequest: [false, Validators.requiredTrue],
  });

  isFieldInvalid(fieldName: string): boolean {
    const field = this.form.get(fieldName);
    return field ? field.invalid && field.touched : false;
  }

  submitRequest(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { firstName, lastName, email, message } = this.form.getRawValue();
    const payload = {
      firstName,
      lastName,
      email,
      subject: 'ACCOUNT_DELETION',
      message: [
        'Demande publique de suppression de compte.',
        '',
        `Email du compte concerné : ${email}`,
        '',
        'Message utilisateur :',
        message,
      ].join('\n'),
    };

    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    this._http.post(`${environment.apiUrl}/contact`, payload).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.isSubmitted.set(true);
      },
      error: (err: { error?: { message?: string } }) => {
        this.isSubmitting.set(false);
        this.errorMessage.set(
          err.error?.message || "Impossible d'envoyer la demande. Réessaie plus tard."
        );
      },
    });
  }

  resetForm(): void {
    this.form.reset({
      firstName: '',
      lastName: '',
      email: '',
      message: '',
      confirmRequest: false,
    });
    this.isSubmitted.set(false);
    this.errorMessage.set(null);
  }
}
