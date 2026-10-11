import { Observable } from 'rxjs';

import type { Goal, GoalPhoto, GoalPhotoVariant } from '~/modules/goals/core/types/goal';

export type PhotoUploadEvent =
  | { readonly kind: 'progress'; readonly percent: number }
  | { readonly kind: 'done'; readonly photo: GoalPhoto };

export abstract class GoalPhotosGateway {
  abstract upload(
    goalId: string,
    file: Blob,
    fileName: string,
    idempotencyKey: string,
  ): Observable<PhotoUploadEvent>;
  abstract content(goalId: string, photoId: string, variant: GoalPhotoVariant): Observable<Blob>;
  abstract reorder(goalId: string, photoIds: readonly string[]): Observable<Goal>;
  abstract setCover(goalId: string, photoId: string): Observable<Goal>;
  abstract remove(goalId: string, photoId: string): Observable<Goal>;
}
