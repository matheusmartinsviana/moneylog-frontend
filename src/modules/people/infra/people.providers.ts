import { Provider } from '@angular/core';

import { PeopleGateway } from '~/modules/people/core/interfaces/people.gateway';
import { PeopleRequestsFacade } from '~/modules/people/infra/facades/people-requests.facade';

export function providePeople(): Provider[] {
  return [{ provide: PeopleGateway, useExisting: PeopleRequestsFacade }];
}
