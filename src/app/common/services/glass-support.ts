export type GlassMode = 'refract' | 'blur' | 'solid';

export function supportsBackdropFilter(doc: Document): boolean {
  const el = doc.createElement('div');
  el.style.cssText = 'backdrop-filter: blur(1px)';
  return Boolean(el.style.backdropFilter);
}

export function supportsBackdropFilterUrl(doc: Document): boolean {
  const el = doc.createElement('div');
  el.style.cssText = 'backdrop-filter: url(#t)';
  return el.style.backdropFilter === 'url(#t)' || el.style.backdropFilter === 'url("#t")';
}

export function isSafari(userAgent: string): boolean {
  return /safari/i.test(userAgent) && !/chrome|chromium|crios|fxios|edg|android/i.test(userAgent);
}

export function detectGlassMode(doc: Document): GlassMode {
  const win = doc.defaultView;
  if (!win || isSafari(win.navigator.userAgent) || !supportsBackdropFilter(doc)) return 'solid';
  const compact = win.matchMedia?.('(max-width: 767px), (pointer: coarse)').matches ?? true;
  return !compact && supportsBackdropFilterUrl(doc) ? 'refract' : 'blur';
}

export function applyGlassMode(doc: Document): GlassMode {
  const mode = detectGlassMode(doc);
  if (mode === 'solid') doc.documentElement.removeAttribute('data-glass');
  else doc.documentElement.setAttribute('data-glass', mode);
  return mode;
}
