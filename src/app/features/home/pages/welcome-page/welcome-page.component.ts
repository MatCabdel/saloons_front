import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { FirebaseAuthService } from '../../../auth/services/firebase-auth.service';

@Component({
  selector: 'app-welcome-page',
  standalone: true,
  templateUrl: './welcome-page.component.html',
  styleUrl: './welcome-page.component.scss',
})
export class WelcomePageComponent implements OnInit, OnDestroy {
  private readonly _router = inject(Router);
  private readonly _firebaseAuthService = inject(FirebaseAuthService);
  private _redirectTimeoutId: ReturnType<typeof setTimeout> | null = null;

  ngOnInit(): void {
    this._redirectTimeoutId = setTimeout(() => {
      void this._router.navigateByUrl(this._getNextRoute(), { replaceUrl: true });
    }, 5200);
  }

  ngOnDestroy(): void {
    if (this._redirectTimeoutId) {
      clearTimeout(this._redirectTimeoutId);
    }
  }

  private _getNextRoute(): string {
    if (!this._firebaseAuthService.isAuthenticated()) {
      return '/auth';
    }

    return this._firebaseAuthService.isProfileComplete() ? '/map' : '/onboarding';
  }
}
