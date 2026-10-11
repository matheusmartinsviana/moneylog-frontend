export const SEARCH_TERM_MAX_LENGTH = 100;

// eslint-disable-next-line no-control-regex
const CONTROL_CHARS = /[\u0000-\u001F\u007F-\u009F]/g;

export function cleanSearchTerm(text: string): string {
  return text.replace(CONTROL_CHARS, '').slice(0, SEARCH_TERM_MAX_LENGTH);
}

export const SEARCH_QUERY_MIN_LENGTH = 2;

export function searchQueryOf(text: string): string | null {
  const cleaned = Array.from(text.replace(CONTROL_CHARS, ' ').trim())
    .slice(0, SEARCH_TERM_MAX_LENGTH)
    .join('')
    .trim();
  return Array.from(cleaned).length >= SEARCH_QUERY_MIN_LENGTH ? cleaned : null;
}
