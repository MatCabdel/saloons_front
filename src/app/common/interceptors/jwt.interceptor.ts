import { HttpInterceptorFn } from '@angular/common/http';
import { environment } from 'src/environments/environment';

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  // Only add JWT to requests targeting our own backend API
  if (!req.url.startsWith(environment.apiUrl)) {
    return next(req);
  }

  if (req.url.includes('/auth/')) {
    return next(req);
  }

  const token = localStorage.getItem('saloon_auth_token');

  if (!token) {
    return next(req);
  }
  return next(
    req.clone({
      setHeaders: { Authorization: `Bearer ${token}` },
    })
  );
};
