import { trimMatching } from '~/util/trim';

const isDot = (char: string): boolean => char === '.';

const CONTROL_AND_BIDI =
  // eslint-disable-next-line no-control-regex
  /[\u0000-\u001f\u007f-\u009f\u200b-\u200f\u2028-\u202e\u2060-\u2069\ufeff]/g;

export const MAX_FILENAME_LENGTH = 100;

function rawFilename(header: string): string | null {
  const extended = /filename\*\s*=\s*(?:UTF-8|utf-8)''([^;]+)/.exec(header);
  const quoted = /filename\s*=\s*"((?:[^"\\]|\\.)*)"/.exec(header);
  const bare = /filename\s*=\s*([^;"\s]+)/.exec(header);
  let raw = extended?.[1] ?? quoted?.[1] ?? bare?.[1] ?? null;
  if (raw === null) return null;
  if (extended) {
    try {
      raw = decodeURIComponent(raw);
    } catch {
      return null;
    }
  }
  return raw.replace(/\\(.)/g, '$1');
}

export function safeFilenameFromContentDisposition(
  header: string | null,
  fallback: string,
): string {
  if (header === null) return fallback;
  const raw = rawFilename(header);
  if (raw === null) return fallback;
  const extension = /\.[A-Za-z0-9]+$/.exec(fallback)?.[0] ?? '';
  const cleaned = (raw.split(/[\\/]/).pop() ?? '')
    .replace(CONTROL_AND_BIDI, '')
    .replace(/[^\p{L}\p{N}._-]/gu, '_')
    .normalize('NFC');
  if (extension === '' || !cleaned.toLowerCase().endsWith(extension.toLowerCase())) return fallback;
  const base = trimMatching(cleaned.slice(0, cleaned.length - extension.length), isDot).slice(
    0,
    MAX_FILENAME_LENGTH - extension.length,
  );
  if (/^[._-]*$/.test(base)) return fallback;
  return base + extension.toLowerCase();
}
