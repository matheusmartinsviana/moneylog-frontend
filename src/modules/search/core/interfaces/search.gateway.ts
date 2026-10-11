import { Observable } from 'rxjs';

import type { SearchResults } from '~/modules/search/core/types/search';

export abstract class SearchGateway {
  abstract search(q: string): Observable<SearchResults>;
}
