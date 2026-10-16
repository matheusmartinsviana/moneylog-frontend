export const OVERLAY_OPEN_CLASS = 'overlay-open';

let open = 0;

export function markOverlayOpen(doc: Document): () => void {
  const root = doc.documentElement;
  open++;
  root.classList.add(OVERLAY_OPEN_CLASS);
  let released = false;
  return () => {
    if (released) return;
    released = true;
    open = Math.max(0, open - 1);
    if (open === 0) root.classList.remove(OVERLAY_OPEN_CLASS);
  };
}
