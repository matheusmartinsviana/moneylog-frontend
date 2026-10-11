import { inject } from '@angular/core';
import { CanMatchFn, Router } from '@angular/router';

import { SessionFacade } from '~/modules/auth/core/facades/session.facade';

export const authGuard: CanMatchFn = () => {
  const session = inject(SessionFacade);
  const router = inject(Router);
  const status = session.status();
  if (status === 'authenticated' || status === 'unreachable') return true;
  const target = router.getCurrentNavigation()?.extractedUrl.toString() ?? '/';
  return router.createUrlTree(['/login'], {
    queryParams: target === '/' ? {} : { returnUrl: target },
  });
};

export const guestGuard: CanMatchFn = () => {
  const session = inject(SessionFacade);
  return session.authenticated() ? inject(Router).createUrlTree(['/']) : true;
};
