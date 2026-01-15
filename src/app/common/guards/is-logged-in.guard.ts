import { CanActivateFn, Router } from '@angular/router';
import { AuthApiService } from '../../features/auth/services/auth-api.service';
import { inject } from '@angular/core';

export const isLoggedInGuard: CanActivateFn = () => {
  const authService = inject(AuthApiService);
  const router = inject(Router);

  if (authService.isLoggedInSimplified()) {
    return true;
  }

  router.navigate(['login']);
  return false;
};
