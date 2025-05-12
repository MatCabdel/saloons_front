import { HttpInterceptorFn } from '@angular/common/http';
import { AuthApiService } from '../../features/auth/services/auth-api.service';
import { inject } from '@angular/core';

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  if (req.url.includes('/auth/')) {
    return next(req);
  }
  const auth = inject(AuthApiService);
  const token = auth.getToken();

  if (!token) {
    return next(req);
  }
  return next(
    req.clone({
      setHeaders: { Authorization: `Bearer ${token}` },
    })
  );
};
