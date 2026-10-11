import type { SearchResultsResponse } from '~/modules/search/infra/responses/search.response';

export function emptySearchResults(q: string): SearchResultsResponse {
  return {
    q,
    transactions: [],
    accounts: [],
    categories: [],
    cards: [],
    notes: [],
    truncated: [],
  };
}
