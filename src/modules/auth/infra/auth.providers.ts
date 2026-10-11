import { Provider } from '@angular/core';

import { AuthGateway } from '~/modules/auth/core/interfaces/auth.gateway';
import { AuthRequestsFacade } from '~/modules/auth/infra/facades/auth-requests.facade';

export function provideAuth(): Provider[] {
  return [{ provide: AuthGateway, useExisting: AuthRequestsFacade }];
}
