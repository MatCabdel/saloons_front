import { AfterViewInit, Component, inject, signal } from '@angular/core';
import { CommonModule, ViewportScroller } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { HeaderComponent } from 'src/app/common/components/header/header.component';
import { environment } from 'src/environments/environment';
import { jwtDecode } from 'jwt-decode';

type JwtPayload = {
  exp?: number;
};

@Component({
  selector: 'app-delete-account-page',
  standalone: true,
  imports: [CommonModule, HeaderComponent, ReactiveFormsModule, RouterModule],
  templateUrl: './delete-account-page.component.html',
  styleUrls: ['./delete-account-page.component.scss'],
})
export class DeleteAccountPageComponent implements AfterViewInit {
  private _fb = inject(FormBuilder);
  private _http = inject(HttpClient);
  private _router = inject(Router);
  private _viewportScroller = inject(ViewportScroller);

  showConfirmation = signal(false);
  isDeleting = signal(false);
  errorMessage = signal<string | null>(null);

  form: FormGroup = this._fb.group({
    confirmText: ['', [Validators.required, Validators.pattern(/^SUPPRIMER$/)]],
  });

  ngAfterViewInit(): void {
    queueMicrotask(() => this._viewportScroller.scrollToPosition([0, 0]));
  }

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

    const token = localStorage.getItem('saloon_auth_token');

    if (!token) {
      this.errorMessage.set('Ta session a expiré. Reconnecte-toi avant de supprimer ton compte.');
      return;
    }

    if (!this._isTokenUsable(token)) {
      localStorage.removeItem('saloon_auth_token');
      this.errorMessage.set('Ta session a expiré. Reconnecte-toi avant de supprimer ton compte.');
      return;
    }

    this.isDeleting.set(true);
    this.errorMessage.set(null);

    this._http
      .delete(`${environment.apiUrl}/user/delete-account`, {
        headers: new HttpHeaders({
          Authorization: `Bearer ${token}`,
        }),
      })
      .subscribe({
        next: () => {
          this.isDeleting.set(false);
          // Clear local storage and redirect
          localStorage.clear();
          this._router.navigate(['/unauthorized'], {
            queryParams: { reason: 'account-deleted' },
          });
        },
        error: (err: HttpErrorResponse) => {
          this.isDeleting.set(false);
          this.errorMessage.set(this._getDeleteErrorMessage(err));
        },
      });
  }

  private _getDeleteErrorMessage(err: HttpErrorResponse): string {
    if (err.status === 401) {
      return 'Ta session a expiré ou n’est plus valide. Reconnecte-toi avant de supprimer ton compte.';
    }

    return err.error?.message || 'Une erreur est survenue lors de la suppression.';
  }

  private _isTokenUsable(token: string): boolean {
    try {
      const decodedToken = jwtDecode<JwtPayload>(token);

      if (!decodedToken.exp) {
        return false;
      }

      return decodedToken.exp * 1000 > Date.now();
    } catch {
      return false;
    }
  }

  goBack(): void {
    this._router.navigate(['/mon-compte']);
  }
}
