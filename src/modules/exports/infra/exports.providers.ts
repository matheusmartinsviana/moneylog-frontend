import { Provider } from '@angular/core';

import { ExportsGateway } from '~/modules/exports/core/interfaces/exports.gateway';
import { ExportsRequestsFacade } from '~/modules/exports/infra/facades/exports-requests.facade';

export function provideExports(): Provider[] {
  return [{ provide: ExportsGateway, useExisting: ExportsRequestsFacade }];
}
