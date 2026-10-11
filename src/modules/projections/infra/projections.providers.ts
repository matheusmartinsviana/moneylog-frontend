import { Provider } from '@angular/core';

import { ProjectionsGateway } from '~/modules/projections/core/interfaces/projections.gateway';
import { ProjectionsRequestsFacade } from '~/modules/projections/infra/facades/projections-requests.facade';

export function provideProjections(): Provider[] {
  return [{ provide: ProjectionsGateway, useExisting: ProjectionsRequestsFacade }];
}
