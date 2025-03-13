import { HttpHeaders, HttpInterceptorFn } from '@angular/common/http';
import { AuthApiService } from '../../features/auth/services/auth-api.service';
import { inject } from '@angular/core';

export const JwtInterceptor: HttpInterceptorFn = (req, next) => {

  const auth = inject(AuthApiService);
  const token = auth.getToken();

  if (!token) {
    return next(req);
  }

  const headers = new HttpHeaders({
    Authorization: `Bearer ${token}`
  })

  const newReq = req.clone({
    headers
  })

  return next(newReq);
};