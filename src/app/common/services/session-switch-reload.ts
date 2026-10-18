import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';

import { HardNavigation } from '~/app/common/services/hard-navigation';
import { SessionFacade } from '~/modules/auth/core/facades/session.facade';
import { safeReturnUrl } from '~/modules/auth/core/types/return-url';

@Injectable({ providedIn: 'root' })
export class SessionSwitchReload {
  private readonly session = inject(SessionFacade);
  private readonly router = inject(Router);
  private readonly hardNavigation = inject(HardNavigation);

  start(): void {
    this.session.userSwitched$.subscribe(() => this.hardNavigation.go(this.target()));
  }

  private target(): string {
    const tree = this.router.parseUrl(this.router.url);
    const onLogin = tree.root.children['primary']?.segments[0]?.path === 'login';
    return onLogin ? safeReturnUrl(tree.queryParams['returnUrl']) : '/';
  }
}
