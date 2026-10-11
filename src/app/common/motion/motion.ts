export function motionEnabled(doc: Document = document): boolean {
  if (doc.documentElement.getAttribute('data-motion') === 'off') return false;
  const view = doc.defaultView;
  if (typeof view?.matchMedia === 'function') {
    return !view.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }
  return true;
}
