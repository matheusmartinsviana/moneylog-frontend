const INTERACTIVE =
  'button, a[href], input, textarea, [tabindex], [role="button"], [role="combobox"]';

let tracked: Document | null = null;
let lastPointerTarget: Element | null = null;

export function trackPointerTarget(doc: Document): void {
  if (tracked === doc) return;
  tracked = doc;
  doc.addEventListener(
    'pointerdown',
    (event) => {
      lastPointerTarget = event.target instanceof Element ? event.target : null;
    },
    true,
  );
  doc.addEventListener('keydown', () => (lastPointerTarget = null), true);
}

export function focusReturnTarget(doc: Document): HTMLElement | null {
  const active = doc.activeElement instanceof HTMLElement ? doc.activeElement : null;
  const pressed = lastPointerTarget?.closest<HTMLElement>(INTERACTIVE) ?? null;
  const usable = pressed?.isConnected === true ? pressed : null;
  if (!active || active === doc.body) return usable;
  if (usable && active !== usable && active.contains(usable)) return usable;
  return active;
}
