import { Provider } from '@angular/core';

import { CardsGateway } from '~/modules/cards/core/interfaces/cards.gateway';
import { CardsRequestsFacade } from '~/modules/cards/infra/facades/cards-requests.facade';

export function provideCards(): Provider[] {
  return [{ provide: CardsGateway, useExisting: CardsRequestsFacade }];
}
