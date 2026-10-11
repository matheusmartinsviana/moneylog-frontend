import { Provider } from '@angular/core';

import { ThirdPartiesGateway } from '~/modules/third-parties/core/interfaces/third-parties.gateway';
import { ThirdPartiesRequestsFacade } from '~/modules/third-parties/infra/facades/third-parties-requests.facade';

export function provideThirdParties(): Provider[] {
  return [{ provide: ThirdPartiesGateway, useExisting: ThirdPartiesRequestsFacade }];
}
