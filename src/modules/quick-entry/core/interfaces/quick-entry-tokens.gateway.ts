import { Observable } from 'rxjs';

import type {
  QuickEntryToken,
  QuickEntryTokenCreation,
  QuickEntryTokenInput,
} from '~/modules/quick-entry/core/types/quick-entry-token';

export abstract class QuickEntryTokensGateway {
  abstract list(): Observable<readonly QuickEntryToken[]>;
  abstract create(input: QuickEntryTokenInput): Observable<QuickEntryTokenCreation>;
  abstract rename(id: string, label: string): Observable<QuickEntryToken>;
  abstract revoke(id: string): Observable<QuickEntryToken>;
}
