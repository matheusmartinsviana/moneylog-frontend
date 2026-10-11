import { motionEnabled } from '~/app/common/motion/motion';

export type GhostKind = 'dialog' | 'sheet' | 'side' | 'popover';

export function playGhostExit(
  backdrop: HTMLElement,
  panel: HTMLElement | null,
  kind: GhostKind,
): void {
  const doc = backdrop.ownerDocument;
  if (!motionEnabled(doc) || typeof backdrop.animate !== 'function' || !backdrop.isConnected)
    return;
  const ghost = backdrop.cloneNode(true) as HTMLElement;
  ghost.removeAttribute('id');
  for (const node of [
    ghost,
    ...Array.from(ghost.querySelectorAll<HTMLElement>('[id],[data-cy]')),
  ]) {
    node.removeAttribute('id');
    node.removeAttribute('data-cy');
  }
  ghost.classList.add('m-ghost');
  ghost.style.animation = 'none';
  ghost.setAttribute('aria-hidden', 'true');
  ghost.setAttribute('inert', '');
  ghost
    .querySelectorAll('[autofocus],[data-autofocus]')
    .forEach((n) => n.removeAttribute('data-autofocus'));
  doc.body.appendChild(ghost);

  const ease = 'cubic-bezier(0.4, 0, 1, 1)';
  const duration = kind === 'popover' ? 110 : 180;
  const target = panel
    ? ghost.querySelector<HTMLElement>(
        '[role="dialog"],[role="alertdialog"],[role="listbox"],.panel',
      )
    : null;
  const frames: Record<GhostKind, Keyframe> = {
    dialog: { opacity: 0, transform: 'scale(0.97) translateY(6px)' },
    sheet: { opacity: 0, transform: 'translateY(24px)' },
    side: { opacity: 0, transform: 'translateX(24px)' },
    popover: { opacity: 0, transform: 'translateY(-4px)' },
  };
  if (target) target.style.animation = 'none';
  const panelOut = target?.animate([{ opacity: 1, transform: 'none' }, frames[kind]], {
    duration,
    easing: ease,
    fill: 'forwards',
  });
  const fade = panelOut
    ? ghost.animate(
        [
          { backgroundColor: getComputedStyle(ghost).backgroundColor },
          { backgroundColor: 'transparent' },
        ],
        {
          duration,
          easing: ease,
          fill: 'forwards',
        },
      )
    : ghost.animate([{ opacity: 1 }, { opacity: 0 }], { duration, easing: ease, fill: 'forwards' });
  const remove = () => ghost.remove();
  fade.onfinish = remove;
  fade.oncancel = remove;
  setTimeout(remove, duration + 300);
}
