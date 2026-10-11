export const FOCUSABLE =
  'button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), a[href], [tabindex]:not([tabindex="-1"]), [contenteditable]:not([contenteditable="false"])';

export function focusableElements(root: HTMLElement): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
    (element) =>
      !element.hidden &&
      element.getAttribute('tabindex') !== '-1' &&
      element.closest('[inert], [hidden]') === null &&
      element.getAttribute('aria-hidden') !== 'true',
  );
}

export function trapTab(event: KeyboardEvent, container: HTMLElement, doc: Document): boolean {
  if (event.key !== 'Tab') return false;
  const focusables = focusableElements(container);
  const first = focusables[0];
  const last = focusables[focusables.length - 1];
  event.preventDefault();
  if (!first || !last) {
    container.focus();
    return true;
  }
  const current = doc.activeElement instanceof HTMLElement ? doc.activeElement : null;
  const index = current ? focusables.indexOf(current) : -1;
  if (event.shiftKey) {
    (index <= 0 ? last : (focusables[index - 1] ?? last)).focus();
  } else {
    (index === -1 || index === focusables.length - 1
      ? first
      : (focusables[index + 1] ?? first)
    ).focus();
  }
  return true;
}
