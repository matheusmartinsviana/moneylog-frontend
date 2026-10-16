import { Provider } from '@angular/core';

import { PurchaseGroupsGateway } from '~/modules/purchase-groups/core/interfaces/purchase-groups.gateway';
import { PurchaseGroupsRequestsFacade } from '~/modules/purchase-groups/infra/facades/purchase-groups-requests.facade';

export function providePurchaseGroups(): Provider[] {
  return [{ provide: PurchaseGroupsGateway, useExisting: PurchaseGroupsRequestsFacade }];
}
