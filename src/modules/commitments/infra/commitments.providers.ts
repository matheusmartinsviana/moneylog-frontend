import { Provider } from '@angular/core';

import { CommitmentsGateway } from '~/modules/commitments/core/interfaces/commitments.gateway';
import { CommitmentsRequestsFacade } from '~/modules/commitments/infra/facades/commitments-requests.facade';

export function provideCommitments(): Provider[] {
  return [{ provide: CommitmentsGateway, useExisting: CommitmentsRequestsFacade }];
}
