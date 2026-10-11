import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';

import { SessionFacade } from '~/modules/auth/core/facades/session.facade';
import { isApiRequest, isAuthRequest } from '~/util/api/api-paths';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  if (!isApiRequest(req.url) || isAuthRequest(req.url)) return next(req);
  const token = inject(SessionFacade).token();
  return next(token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req);
};
