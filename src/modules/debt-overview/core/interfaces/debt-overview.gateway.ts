import { Observable } from 'rxjs';

import type {
  DebtOverview,
  OngoingInstallmentsInput,
  OngoingPreview,
} from '~/modules/debt-overview/core/types/debt-overview';

export abstract class DebtOverviewGateway {
  abstract get(months: number): Observable<DebtOverview>;
  abstract previewOngoing(
    cardId: string,
    input: OngoingInstallmentsInput,
  ): Observable<OngoingPreview>;
  abstract createOngoing(cardId: string, input: OngoingInstallmentsInput): Observable<string>;
}
