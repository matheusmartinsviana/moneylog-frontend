import { Provider } from '@angular/core';

import { CategoriesGateway } from '~/modules/categories/core/interfaces/categories.gateway';
import { CategoriesRequestsFacade } from '~/modules/categories/infra/facades/categories-requests.facade';

export function provideCategories(): Provider[] {
  return [{ provide: CategoriesGateway, useExisting: CategoriesRequestsFacade }];
}
