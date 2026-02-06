import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { FirebaseAuthService } from '../../features/auth/services/firebase-auth.service';

/**
 * Guard that prevents access to protected routes if user profile is incomplete.
 * Redirects to onboarding if profile status is PROFILE_INCOMPLETE.
 */
export const profileCompleteGuard: CanActivateFn = () => {
  const firebaseAuthService = inject(FirebaseAuthService);
  const router = inject(Router);

  // Check if user is authenticated first
  if (!firebaseAuthService.isAuthenticated()) {
    router.navigate(['/']);
    return false;
  }

  // Check if profile is complete
  if (!firebaseAuthService.isProfileComplete()) {
    router.navigate(['/onboarding']);
    return false;
  }

  return true;
};

/**
 * Guard that prevents authenticated users with complete profiles from accessing auth/onboarding pages.
 * EXCEPTION: Allow access to /login even if authenticated (to allow logout or account switching).
 */
export const authGuard: CanActivateFn = route => {
  const firebaseAuthService = inject(FirebaseAuthService);
  const router = inject(Router);

  // Allow access to /login even if authenticated (for logout/account switching)
  const isLoginPage = route.routeConfig?.path === 'login';
  
  // If user is authenticated
  if (firebaseAuthService.isAuthenticated()) {
    // Allow login page access (for logout/switching accounts)
    if (isLoginPage) {
      return true;
    }
    
    // For other auth pages (registration), redirect based on profile status
    if (firebaseAuthService.isProfileComplete()) {
      router.navigate(['/map']);
      return false;
    }
    // If profile is incomplete, redirect to onboarding
    router.navigate(['/onboarding']);
    return false;
  }

  return true;
};

/**
 * Guard for onboarding page - only allows access if user is authenticated but profile is incomplete.
 */
export const onboardingGuard: CanActivateFn = () => {
  const firebaseAuthService = inject(FirebaseAuthService);
  const router = inject(Router);

  // If user is not authenticated, redirect to home (auth page)
  if (!firebaseAuthService.isAuthenticated()) {
    router.navigate(['/']);
    return false;
  }

  // If profile is already complete, redirect to map
  if (firebaseAuthService.isProfileComplete()) {
    router.navigate(['/map']);
    return false;
  }

  return true;
};
