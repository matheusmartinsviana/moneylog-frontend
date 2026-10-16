import { Provider } from '@angular/core';

import { SimulationsGateway } from '~/modules/simulations/core/interfaces/simulations.gateway';
import { SimulationsRequestsFacade } from '~/modules/simulations/infra/facades/simulations-requests.facade';

export function provideSimulations(): Provider[] {
  return [{ provide: SimulationsGateway, useExisting: SimulationsRequestsFacade }];
}
