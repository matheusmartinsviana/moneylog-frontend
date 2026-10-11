import { Provider } from '@angular/core';

import { SearchGateway } from '~/modules/search/core/interfaces/search.gateway';
import { SearchRequestsFacade } from '~/modules/search/infra/facades/search-requests.facade';

export function provideSearch(): Provider[] {
  return [{ provide: SearchGateway, useExisting: SearchRequestsFacade }];
}
