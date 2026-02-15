import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';

let isLoggingOut = false; // Éviter les redirections multiples

export const httpErrorInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      console.error('🚨 Erreur HTTP interceptée :', error.status, error.url);

      // Si l'utilisateur n'est plus authentifié ou autorisé (compte supprimé, token expiré, etc.)
      if ((error.status === 401 || error.status === 403) && !isLoggingOut) {
        // Ne pas déconnecter si c'est une requête d'authentification
        if (!req.url.includes('/auth/')) {
          console.log('🔒 Utilisateur non autorisé, déconnexion forcée...');
          isLoggingOut = true;

          // Nettoyer le stockage local
          localStorage.removeItem('saloon_auth_token');
          localStorage.removeItem('user');
          sessionStorage.clear();

          // Forcer la redirection avec rechargement complet de la page
          window.location.href = '/login';
        }
      }

      return throwError(() => error);
    })
  );
};
