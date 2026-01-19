import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { HeaderComponent } from 'src/app/common/components/header/header.component';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-contact-page',
  standalone: true,
  imports: [CommonModule, HeaderComponent, ReactiveFormsModule, RouterModule],
  templateUrl: './contact-page.component.html',
  styleUrls: ['./contact-page.component.scss'],
})
export class ContactPageComponent {
  private _fb = inject(FormBuilder);
  private _http = inject(HttpClient);

  isSubmitting = signal(false);
  isSubmitted = signal(false);
  errorMessage = signal<string | null>(null);

  subjects = [
    { value: 'QUESTION', label: '❓ Question générale' },
    { value: 'SUGGESTION', label: '💡 Suggestion d\'amélioration' },
    { value: 'BUG', label: '🐛 Signaler un bug' },
    { value: 'PARTNERSHIP', label: '🤝 Proposition de partenariat' },
    { value: 'REPORT', label: '🚨 Signalement' },
    { value: 'OTHER', label: '📝 Autre' },
  ];

  form: FormGroup = this._fb.group({
    lastName: ['', [Validators.required, Validators.minLength(2)]],
    firstName: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    subject: ['', Validators.required],
    message: ['', [Validators.required, Validators.minLength(10)]],
  });

  isFieldInvalid(fieldName: string): boolean {
    const field = this.form.get(fieldName);
    return field ? field.invalid && field.touched : false;
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    const formData = this.form.value;

    this._http.post(`${environment.apiUrl}/contact`, formData).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.isSubmitted.set(true);
      },
      error: (err: { error?: { message?: string } }) => {
        this.isSubmitting.set(false);
        this.errorMessage.set(err.error?.message || 'Une erreur est survenue. Réessaie plus tard.');
      },
    });
  }

  resetForm(): void {
    this.form.reset();
    this.isSubmitted.set(false);
    this.errorMessage.set(null);
  }
}
