import { Provider } from '@angular/core';

import { QuickEntryTokensGateway } from '~/modules/quick-entry/core/interfaces/quick-entry-tokens.gateway';
import { QuickEntryRequestsFacade } from '~/modules/quick-entry/infra/facades/quick-entry-requests.facade';

export function provideQuickEntry(): Provider[] {
  return [{ provide: QuickEntryTokensGateway, useExisting: QuickEntryRequestsFacade }];
}
