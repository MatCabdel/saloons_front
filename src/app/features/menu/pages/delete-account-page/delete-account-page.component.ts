import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { HeaderComponent } from 'src/app/common/components/header/header.component';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-delete-account-page',
  standalone: true,
  imports: [CommonModule, HeaderComponent, ReactiveFormsModule, RouterModule],
  templateUrl: './delete-account-page.component.html',
  styleUrls: ['./delete-account-page.component.scss'],
})
export class DeleteAccountPageComponent {
  private _fb = inject(FormBuilder);
  private _http = inject(HttpClient);
  private _router = inject(Router);

  showConfirmation = signal(false);
  isDeleting = signal(false);
  errorMessage = signal<string | null>(null);

  form: FormGroup = this._fb.group({
    confirmText: ['', [Validators.required, Validators.pattern(/^SUPPRIMER$/)]],
  });

  proceedToConfirmation(): void {
    this.showConfirmation.set(true);
  }

  cancelDeletion(): void {
    this.showConfirmation.set(false);
    this.form.reset();
    this.errorMessage.set(null);
  }

  isConfirmValid(): boolean {
    return this.form.get('confirmText')?.value === 'SUPPRIMER';
  }

  deleteAccount(): void {
    if (!this.isConfirmValid()) {
      return;
    }

    this.isDeleting.set(true);
    this.errorMessage.set(null);

    this._http.delete(`${environment.apiUrl}/user/delete-account`).subscribe({
      next: () => {
        this.isDeleting.set(false);
        // Clear local storage and redirect
        localStorage.clear();
        this._router.navigate(['/unauthorized'], {
          queryParams: { reason: 'account-deleted' },
        });
      },
      error: (err: { error?: { message?: string } }) => {
        this.isDeleting.set(false);
        this.errorMessage.set(
          err.error?.message || 'Une erreur est survenue lors de la suppression.'
        );
      },
    });
  }

  goBack(): void {
    this._router.navigate(['/mon-compte']);
  }
}
