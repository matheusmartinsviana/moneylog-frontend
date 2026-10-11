import type { CommitmentSliceResponse } from '~/modules/commitments/infra/responses/commitment.response';

export function emptyCommitments(): CommitmentSliceResponse {
  return { items: [], hasNext: false };
}
