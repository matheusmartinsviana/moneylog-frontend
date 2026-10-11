const EXTERNAL_PROTOCOLS = ['http:', 'https:'];
const CONTACT_PROTOCOLS = ['mailto:'];
const MAX_URL_LENGTH = 2048;

export interface SafeLink {
  readonly href: string;
  readonly external: boolean;
}

export function safeLink(href: string): SafeLink | null {
  const raw = href.trim();
  if (raw === '' || raw.length > MAX_URL_LENGTH) return null;
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return null;
  }
  if (EXTERNAL_PROTOCOLS.includes(url.protocol)) {
    if (url.username !== '' || url.password !== '') return null;
    return { href: url.href, external: true };
  }
  if (CONTACT_PROTOCOLS.includes(url.protocol)) return { href: url.href, external: false };
  return null;
}
