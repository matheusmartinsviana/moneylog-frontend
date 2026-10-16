import { Observable } from 'rxjs';

import type {
  PurchaseCommitments,
  PurchaseGroup,
  PurchaseGroupInput,
  PurchaseGroupStatus,
  PurchaseGroupUpdate,
} from '~/modules/purchase-groups/core/types/purchase-group';
import type { Slice } from '~/util/api/slice';

export abstract class PurchaseGroupsGateway {
  abstract list(
    status: PurchaseGroupStatus,
    page: number,
    pageSize: number,
  ): Observable<Slice<PurchaseGroup>>;
  abstract create(input: PurchaseGroupInput, idempotencyKey: string): Observable<PurchaseGroup>;
  abstract update(id: string, input: PurchaseGroupUpdate): Observable<PurchaseGroup>;
  abstract addMember(id: string, transactionId: string): Observable<PurchaseGroup>;
  abstract removeMember(id: string, transactionId: string): Observable<PurchaseGroup>;
  abstract commitments(until: string): Observable<PurchaseCommitments>;
}
