import { Provider } from '@angular/core';

import { AssetsGateway } from '~/modules/assets/core/interfaces/assets.gateway';
import { AssetsRequestsFacade } from '~/modules/assets/infra/facades/assets-requests.facade';

export function provideAssets(): Provider[] {
  return [{ provide: AssetsGateway, useExisting: AssetsRequestsFacade }];
}
