import { inject } from '@angular/core';
import { HttpInterceptorFn } from '@angular/common/http';
import { AuthTokenStore } from '../services/auth-token.store';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const tokenStore = inject(AuthTokenStore);
  const authHeader = tokenStore.authorizationHeader();

  if (!authHeader) {
    return next(req);
  }

  return next(req.clone({ setHeaders: { Authorization: authHeader } }));
};
