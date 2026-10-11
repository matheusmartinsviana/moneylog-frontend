import { Observable } from 'rxjs';

import type {
  Commitment,
  CommitmentInput,
  CommitmentProgressInput,
} from '~/modules/commitments/core/types/commitment';
import type { Slice } from '~/util/api/slice';

export interface CommitmentsQuery {
  readonly page: number;
  readonly pageSize: number;
}

export abstract class CommitmentsGateway {
  abstract list(query: CommitmentsQuery): Observable<Slice<Commitment>>;
  abstract get(id: string): Observable<Commitment>;
  abstract create(input: CommitmentInput, idempotencyKey: string): Observable<Commitment>;
  abstract payItem(
    id: string,
    position: number,
    paidOn: string,
    version: number,
  ): Observable<Commitment>;
  abstract updateProgress(id: string, input: CommitmentProgressInput): Observable<Commitment>;
}
