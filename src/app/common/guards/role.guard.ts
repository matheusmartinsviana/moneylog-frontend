import { inject } from '@angular/core';
import { CanMatchFn, Router } from '@angular/router';

import { SessionFacade } from '~/modules/auth/core/facades/session.facade';
import type { UserRole } from '~/modules/auth/core/types/auth-token';

export function roleGuard(required: UserRole): CanMatchFn {
  return () => {
    const session = inject(SessionFacade);
    return session.role() === required ? true : inject(Router).createUrlTree(['/']);
  };
}

export const ownerGuard: CanMatchFn = roleGuard('OWNER');
