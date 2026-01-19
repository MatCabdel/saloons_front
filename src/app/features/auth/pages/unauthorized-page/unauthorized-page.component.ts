import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-unauthorized-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './unauthorized-page.component.html',
  styleUrl: './unauthorized-page.component.scss',
})
export class UnauthorizedPageComponent implements OnInit {
  private _router = inject(Router);
  private _route = inject(ActivatedRoute);

  reason: string = '';
  message: string = '';

  ngOnInit(): void {
    this._route.queryParams.subscribe(params => {
      this.reason = params['reason'] || 'unknown';
      this._setMessage();
    });
  }

  private _setMessage(): void {
    switch (this.reason) {
      case 'session_expired':
        this.message = 'Votre session a expiré ou votre compte n\'existe plus.';
        break;
      case 'account_deleted':
        this.message = 'Votre compte a été supprimé.';
        break;
      default:
        this.message = 'Vous n\'êtes pas autorisé à accéder à cette ressource.';
    }
  }

  goToLogin(): void {
    this._router.navigate(['/login']);
  }

  goToHome(): void {
    this._router.navigate(['/']);
  }
}
