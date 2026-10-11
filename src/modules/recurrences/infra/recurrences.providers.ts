import { Provider } from '@angular/core';

import { RecurrencesGateway } from '~/modules/recurrences/core/interfaces/recurrences.gateway';
import { RecurrencesRequestsFacade } from '~/modules/recurrences/infra/facades/recurrences-requests.facade';

export function provideRecurrences(): Provider[] {
  return [{ provide: RecurrencesGateway, useExisting: RecurrencesRequestsFacade }];
}
