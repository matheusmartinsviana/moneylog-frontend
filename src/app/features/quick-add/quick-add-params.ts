const MAX_DESCRIPTION = 200;

export function sanitizeSharedText(raw: string | null): string {
  if (raw === null) return '';
  return raw
    .replace(/<[^>]*>/g, ' ')
    .replace(/\p{Cc}/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, MAX_DESCRIPTION);
}
