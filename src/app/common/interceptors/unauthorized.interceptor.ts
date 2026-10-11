import { HttpContextToken, HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError } from 'rxjs';

import { SessionFacade } from '~/modules/auth/core/facades/session.facade';
import { AuthFailure } from '~/modules/auth/core/types/auth-failure';
import { isApiRequest, isAuthRequest } from '~/util/api/api-paths';

export const RETRIED_AFTER_REFRESH = new HttpContextToken<boolean>(() => false);

export const unauthorizedInterceptor: HttpInterceptorFn = (req, next) => {
  if (!isApiRequest(req.url) || isAuthRequest(req.url)) return next(req);

  const session = inject(SessionFacade);
  const router = inject(Router);
  const usedToken = session.token();

  return next(req).pipe(
    catchError((error: unknown) => {
      const unauthorized = error instanceof HttpErrorResponse && error.status === 401;
      if (!unauthorized || req.context.get(RETRIED_AFTER_REFRESH)) {
        return throwError(() => error);
      }
      return session.refreshAfterUnauthorized(usedToken).pipe(
        switchMap(() => next(req.clone({ context: req.context.set(RETRIED_AFTER_REFRESH, true) }))),
        catchError((failure: unknown) => {
          if (failure instanceof AuthFailure) {
            if (failure.reason === 'refresh_invalid' && session.status() !== 'anonymous') {
              const returnUrl = router.url;
              session.clear();
              void router.navigate(['/login'], {
                queryParams:
                  returnUrl === '/' || returnUrl.startsWith('/login') ? {} : { returnUrl },
              });
            }
            return throwError(() => error);
          }
          return throwError(() => failure);
        }),
      );
    }),
  );
};
