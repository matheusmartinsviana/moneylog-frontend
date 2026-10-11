import { Provider } from '@angular/core';

import { ImportsGateway } from '~/modules/imports/core/interfaces/imports.gateway';
import { ImportsRequestsFacade } from '~/modules/imports/infra/facades/imports-requests.facade';

export function provideImports(): Provider[] {
  return [{ provide: ImportsGateway, useExisting: ImportsRequestsFacade }];
}
