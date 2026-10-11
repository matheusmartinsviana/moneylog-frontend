import { lockScroll } from '~/app/common/components/overlay/scroll-lock';

export const MODAL_SAFE_ATTRIBUTE = 'data-modal-safe';

const modals: HTMLElement[] = [];
const inerted = new Set<HTMLElement>();

export function activeModal(): HTMLElement | null {
  for (let i = modals.length - 1; i >= 0; i--) {
    const modal = modals[i];
    if (modal?.isConnected) return modal;
  }
  return null;
}

function isSafe(element: HTMLElement): boolean {
  return element.hasAttribute(MODAL_SAFE_ATTRIBUTE);
}

function applyInert(modal: HTMLElement | null): void {
  for (const element of inerted) element.removeAttribute('inert');
  inerted.clear();
  if (!modal) return;
  let node: HTMLElement = modal;
  while (node.parentElement) {
    const parent: HTMLElement = node.parentElement;
    for (const sibling of Array.from(parent.children)) {
      if (sibling === node || !(sibling instanceof HTMLElement)) continue;
      markInert(sibling);
    }
    node = parent;
    if (node === node.ownerDocument.body) break;
  }
}

function markInert(element: HTMLElement): void {
  if (isSafe(element) || element.tagName === 'SCRIPT') return;
  if (element.querySelector(`[${MODAL_SAFE_ATTRIBUTE}]`)) {
    for (const child of Array.from(element.children)) {
      if (child instanceof HTMLElement) markInert(child);
    }
    return;
  }
  element.setAttribute('inert', '');
  inerted.add(element);
}

export function lockModal(modal: HTMLElement): () => void {
  const doc = modal.ownerDocument;
  const releaseScroll = lockScroll(doc.body);
  modals.push(modal);
  applyInert(modal);
  let released = false;
  return () => {
    if (released) return;
    released = true;
    const index = modals.indexOf(modal);
    if (index >= 0) modals.splice(index, 1);
    applyInert(activeModal());
    releaseScroll();
  };
}
