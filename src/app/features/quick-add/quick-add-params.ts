const MAX_DESCRIPTION = 200;

function stripTags(text: string): string {
  let result = '';
  let cursor = 0;
  while (cursor < text.length) {
    const open = text.indexOf('<', cursor);
    if (open === -1) break;
    const close = text.indexOf('>', open + 1);
    if (close === -1) break;
    result += text.slice(cursor, open) + ' ';
    cursor = close + 1;
  }
  return result + text.slice(cursor);
}

export function sanitizeSharedText(raw: string | null): string {
  if (raw === null) return '';
  return stripTags(raw)
    .replace(/\p{Cc}/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, MAX_DESCRIPTION);
}
