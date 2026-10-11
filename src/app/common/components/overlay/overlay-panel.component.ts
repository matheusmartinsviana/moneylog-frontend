import { DOCUMENT } from '@angular/common';
import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  Injector,
  input,
  OnDestroy,
  output,
  signal,
  untracked,
  viewChild,
} from '@angular/core';

import { IconComponent } from '~/app/common/components/icon/icon.component';
import {
  focusReturnTarget,
  trackPointerTarget,
} from '~/app/common/components/overlay/focus-return';
import { focusableElements, trapTab } from '~/app/common/components/overlay/focus-trap';
import { lockModal } from '~/app/common/components/overlay/modal-lock';
import { computePosition } from '~/app/common/components/overlay/popover-positioner';
import { ViewportService } from '~/app/common/components/overlay/viewport.service';
import { I18nService } from '~/app/common/i18n/i18n.service';

export type OverlayMode = 'auto' | 'popover' | 'sheet' | 'modal';

export type OverlayLayout = 'bottom' | 'center' | 'side' | 'responsive-center' | 'responsive-side';

export type ModalRole = 'dialog' | 'alertdialog';

let ghostExit: typeof import('~/app/common/motion/ghost-exit') | null = null;

const stack: object[] = [];

@Component({
  selector: 'app-overlay-panel',
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (open()) {
      <!-- eslint-disable-next-line @angular-eslint/template/no-inline-styles -->
      <div
        class="backdrop"
        role="presentation"
        [class.backdrop--modal]="modal()"
        [class.backdrop--dialog]="mode() === 'modal'"
        [class.backdrop--center]="kind() === 'center'"
        [class.backdrop--side]="kind() === 'side'"
        [attr.data-cy]="cy() + '-backdrop'"
        [style.padding-bottom.px]="
          kind() === 'center' && keyboardOffset() > 0 ? keyboardOffset() + 12 : null
        "
        (click)="onBackdropClick($event)"
      >
        <!-- eslint-disable-next-line @angular-eslint/template/no-inline-styles -->
        <div
          #panel
          class="panel glass glass--strong"
          [class.panel--modal]="modal()"
          [class.panel--sheet]="kind() === 'bottom'"
          [class.panel--center]="kind() === 'center'"
          [class.panel--side]="kind() === 'side'"
          [class.panel--scroll]="scrollBody()"
          [attr.role]="role()"
          [attr.aria-modal]="modal() ? 'true' : null"
          [attr.aria-label]="role() ? label() : null"
          [attr.aria-describedby]="modal() ? describedBy() : null"
          [attr.tabindex]="modal() ? -1 : null"
          [attr.data-cy]="panelCy() ?? cy() + '-panel'"
          [style]="panelStyle()"
          [attr.data-side]="modal() ? (kind() === 'bottom' ? 'sheet' : kind()) : position().side"
          [attr.data-positioned]="positioned() ? 'true' : null"
          (keydown)="onKeydown($event)"
        >
          @if (modal()) {
            <div class="panel__header">
              <h2 class="panel__title">{{ label() }}</h2>
              @if (showClose() && dismissable()) {
                <button
                  type="button"
                  class="panel__close"
                  [attr.aria-label]="t().form.ui.close"
                  [attr.data-cy]="cy() + '-close'"
                  (click)="closed.emit()"
                >
                  <app-icon name="close" [size]="20" />
                </button>
              }
            </div>
          }
          <div class="panel__body">
            <ng-content />
          </div>
        </div>
      </div>
    }
  `,
  styles: `
    :host {
      display: contents;
    }

    .backdrop {
      position: fixed;
      inset: 0;
      z-index: var(--z-popover);
      pointer-events: none;
    }

    .backdrop--modal {
      background-color: var(--color-scrim);
      pointer-events: auto;
      animation: overlay-scrim var(--duration-base) var(--ease-standard);
    }

    .backdrop--dialog {
      z-index: var(--z-dialog);
    }

    .backdrop--center {
      display: grid;
      place-items: center;
      padding: max(var(--space-3), env(safe-area-inset-top))
        max(var(--space-3), env(safe-area-inset-right))
        max(var(--space-3), env(safe-area-inset-bottom))
        max(var(--space-3), env(safe-area-inset-left));
    }

    .panel {
      position: fixed;
      display: flex;
      flex-direction: column;
      min-width: 0;
      overflow: hidden;
      border-radius: var(--radius-card);
      pointer-events: auto;
      animation: overlay-pop var(--duration-fast) var(--ease-standard);
    }

    .panel:not(.panel--modal):not([data-positioned]) {
      opacity: 0;
    }

    .panel[data-side='above'] {
      animation-name: overlay-pop-up;
    }

    .panel[data-side='end'] {
      animation-name: overlay-pop-end;
    }

    .panel--sheet {
      right: 0;
      left: 0;
      max-height: min(92dvh, 48rem);
      overscroll-behavior: contain;
      border-right: 0;
      border-bottom: 0;
      border-left: 0;
      border-radius: var(--radius-panel) var(--radius-panel) 0 0;
      padding-bottom: env(safe-area-inset-bottom);
      animation: overlay-sheet var(--duration-slow) var(--ease-emphasized);
    }

    .panel--center {
      position: relative;
      width: min(100%, 28rem);
      max-height: min(90dvh, 40rem);
      overscroll-behavior: contain;
      border-radius: var(--radius-card);
      box-shadow: var(--shadow-2);
      animation: overlay-dialog var(--duration-base) var(--ease-emphasized);
    }

    .panel--side {
      top: 0;
      right: 0;
      bottom: 0;
      width: min(100%, 26rem);
      border-top: 0;
      border-right: 0;
      border-bottom: 0;
      border-radius: var(--radius-panel) 0 0 var(--radius-panel);
      padding-bottom: env(safe-area-inset-bottom);
      overscroll-behavior: contain;
      animation: overlay-side var(--duration-slow) var(--ease-emphasized);
    }

    .panel--scroll .panel__body {
      overflow-y: auto;
      overscroll-behavior: contain;
      scroll-padding-block: var(--space-4) 6rem;
    }

    .panel__header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--space-3);
      padding: var(--space-3) var(--space-3) var(--space-2) var(--space-5);
    }

    .panel__title {
      font-size: var(--text-lg);
      font-weight: var(--weight-semibold);
    }

    .panel__close {
      display: inline-grid;
      place-items: center;
      width: 2.75rem;
      height: 2.75rem;
      border: 0;
      border-radius: var(--radius-control);
      background: transparent;
      color: var(--color-text-muted);
    }

    .panel__close:hover {
      background-color: var(--color-hover-soft);
      color: var(--color-text);
    }

    .panel__body {
      display: flex;
      flex-direction: column;
      flex: 1 1 auto;
      min-height: 0;
    }

    @keyframes overlay-scrim {
      from {
        background-color: transparent;
      }
    }

    @keyframes overlay-pop {
      from {
        opacity: 0;
        transform: translateY(-4px);
      }
    }

    @keyframes overlay-dialog {
      from {
        opacity: 0;
        transform: translateY(8px) scale(0.97);
      }
    }

    @keyframes overlay-pop-end {
      from {
        opacity: 0;
        transform: translateX(-6px);
      }
    }

    @keyframes overlay-pop-up {
      from {
        opacity: 0;
        transform: translateY(4px);
      }
    }

    @keyframes overlay-side {
      from {
        transform: translateX(24px);
        opacity: 0;
      }
    }

    @keyframes overlay-sheet {
      from {
        transform: translateY(24px);
        opacity: 0;
      }
    }
  `,
})
export class OverlayPanelComponent implements OnDestroy {
  private readonly document = inject(DOCUMENT);
  private readonly injector = inject(Injector);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly viewport = inject(ViewportService);
  protected readonly t = inject(I18nService).t;

  readonly open = input.required<boolean>();
  readonly anchor = input<HTMLElement | null>(null);
  readonly label = input.required<string>();
  readonly mode = input<OverlayMode>('auto');
  readonly popoverRole = input<string | null>('dialog');
  readonly modalRole = input<ModalRole>('dialog');
  readonly layout = input<OverlayLayout>('bottom');
  readonly describedBy = input<string | null>(null);
  readonly dismissable = input(true);
  readonly showClose = input(true);
  readonly scrollBody = input(false);
  readonly panelCy = input<string | null>(null);
  readonly matchWidth = input(false);
  readonly panelWidth = input<number | null>(null);
  readonly minWidth = input(0);
  readonly align = input<'start' | 'end'>('start');
  readonly placement = input<'block' | 'inline'>('block');
  readonly cy = input('overlay');

  readonly closed = output<void>();

  private readonly panel = viewChild<ElementRef<HTMLElement>>('panel');

  protected readonly modal = computed(
    () =>
      this.mode() === 'sheet' ||
      this.mode() === 'modal' ||
      (this.mode() === 'auto' && this.viewport.compact()),
  );
  protected readonly kind = computed<'popover' | OverlayLayout>(() => {
    if (!this.modal()) return 'popover';
    const layout = this.layout();
    if (layout === 'responsive-center') return 'center';
    if (layout === 'responsive-side') return this.viewport.compact() ? 'center' : 'side';
    if (layout === 'bottom' && this.viewport.compact()) return 'center';
    return layout;
  });
  protected readonly role = computed(() => (this.modal() ? this.modalRole() : this.popoverRole()));
  protected readonly position = signal<{
    top: number;
    left: number;
    maxHeight: number;
    side: 'below' | 'above' | 'end';
  }>({ top: 0, left: 0, maxHeight: 360, side: 'below' });
  protected readonly width = signal<number | null>(null);
  protected readonly keyboardOffset = signal(0);
  protected readonly visibleHeight = signal<number | null>(null);
  protected readonly positioned = signal(false);
  protected readonly panelStyle = computed(() => {
    if (this.kind() === 'center') {
      const visible = this.visibleHeight();
      return visible === null ? {} : { 'max-height': `min(90dvh, 40rem, ${visible - 24}px)` };
    }
    if (this.kind() === 'bottom') {
      const visible = this.visibleHeight();
      return {
        bottom: `${this.keyboardOffset()}px`,
        ...(visible === null ? {} : { 'max-height': `min(92dvh, 48rem, ${visible - 16}px)` }),
      };
    }
    if (this.modal()) return {};
    const { top, left, maxHeight } = this.position();
    const width = this.width();
    return {
      top: `${top}px`,
      left: `${left}px`,
      'max-height': `${maxHeight}px`,
      ...(width === null ? {} : { width: `${width}px` }),
    };
  });

  private readonly token = {};
  private marker: Comment | null = null;
  private returnFocus: HTMLElement | null = null;

  constructor() {
    trackPointerTarget(this.document);
    effect((onCleanup) => {
      if (!this.open()) return;
      untracked(() => this.onOpen());
      const view = this.document.defaultView;
      const keydown = (event: KeyboardEvent) => this.onDocumentKeydown(event);
      const pointerdown = (event: PointerEvent) => this.onDocumentPointerDown(event);
      const focusin = (event: FocusEvent) => this.onDocumentFocusIn(event);
      const reposition = () => this.update();
      const visual = view?.visualViewport ?? null;
      this.document.addEventListener('keydown', keydown, true);
      this.document.addEventListener('pointerdown', pointerdown, true);
      this.document.addEventListener('focusin', focusin, true);
      view?.addEventListener('resize', reposition);
      view?.addEventListener('scroll', reposition, true);
      visual?.addEventListener('resize', reposition);
      visual?.addEventListener('scroll', reposition);
      onCleanup(() => {
        this.document.removeEventListener('keydown', keydown, true);
        this.document.removeEventListener('pointerdown', pointerdown, true);
        this.document.removeEventListener('focusin', focusin, true);
        view?.removeEventListener('resize', reposition);
        view?.removeEventListener('scroll', reposition, true);
        visual?.removeEventListener('resize', reposition);
        visual?.removeEventListener('scroll', reposition);
        untracked(() => {
          this.exitGhost();
          this.onClose();
        });
      });
    });

    effect((onCleanup) => {
      if (!this.open() || !this.modal()) return;
      this.portal();
      const release = lockModal(this.host.nativeElement);
      onCleanup(release);
    });

    effect(() => {
      this.anchor();
      this.kind();
      this.matchWidth();
      if (this.open()) afterNextRender(() => this.update(), { injector: this.injector });
    });
  }

  private exitGhost(): void {
    const panel = this.panel()?.nativeElement;
    const backdrop = panel?.parentElement;
    if (!panel || !backdrop?.isConnected) return;
    const kind = this.kind();
    const shape =
      kind === 'center'
        ? 'dialog'
        : kind === 'bottom'
          ? 'sheet'
          : kind === 'side'
            ? 'side'
            : 'popover';
    ghostExit?.playGhostExit(backdrop, panel, shape);
  }

  ngOnDestroy(): void {
    this.onClose();
  }

  protected onBackdropClick(event: MouseEvent): void {
    if (this.modal() && this.dismissable() && event.target === event.currentTarget) {
      this.closed.emit();
    }
  }

  protected onKeydown(event: KeyboardEvent): void {
    if (event.key !== 'Tab') return;
    const panel = this.panel()?.nativeElement;
    if (!panel) return;
    if (!this.modal()) {
      event.preventDefault();
      this.closed.emit();
      this.focusTrigger();
      return;
    }
    trapTab(event, panel, this.document);
  }

  private focusTrigger(): void {
    const remembered = this.returnFocus;
    const anchor = this.anchor();
    const target =
      remembered?.isConnected === true
        ? remembered
        : anchor
          ? (focusableElements(anchor)[0] ?? null)
          : null;
    target?.focus();
  }

  private onOpen(): void {
    if (!ghostExit) void import('~/app/common/motion/ghost-exit').then((m) => (ghostExit = m));
    stack.push(this.token);
    this.returnFocus = focusReturnTarget(this.document);
    this.portal();
    afterNextRender(
      () => {
        this.update();
        const panel = this.panel()?.nativeElement;
        const target = panel?.querySelector<HTMLElement>('[data-autofocus]');
        if (target) target.focus({ preventScroll: true });
        else if (this.modal()) panel?.focus({ preventScroll: true });
      },
      { injector: this.injector },
    );
  }

  private portal(): void {
    const host = this.host.nativeElement;
    if (this.marker || !host.parentNode || host.parentNode === this.document.body) return;
    this.marker = this.document.createComment('overlay');
    host.parentNode.insertBefore(this.marker, host);
    this.document.body.appendChild(host);
  }

  private onClose(): void {
    const index = stack.indexOf(this.token);
    if (index >= 0) stack.splice(index, 1);
    this.positioned.set(false);
    const host = this.host.nativeElement;
    if (this.marker?.parentNode) {
      this.marker.parentNode.insertBefore(host, this.marker);
      this.marker.remove();
    }
    this.marker = null;
    const target = this.returnFocus;
    this.returnFocus = null;
    if (target) {
      try {
        afterNextRender(
          () => {
            const active = this.document.activeElement;
            if ((!active || active === this.document.body) && target.isConnected) target.focus();
          },
          { injector: this.injector },
        );
      } catch {}
    }
  }

  private onDocumentKeydown(event: KeyboardEvent): void {
    if (event.key !== 'Escape' || stack[stack.length - 1] !== this.token) return;
    event.preventDefault();
    event.stopPropagation();
    if (this.modal() && !this.dismissable()) return;
    this.closed.emit();
  }

  private onDocumentFocusIn(event: FocusEvent): void {
    if (this.modal() || stack[stack.length - 1] !== this.token) return;
    const target = event.target as Node | null;
    if (!target || target === this.document.body) return;
    if (this.panel()?.nativeElement.contains(target) || this.anchor()?.contains(target)) return;
    this.closed.emit();
  }

  private onDocumentPointerDown(event: PointerEvent): void {
    if (this.modal() || stack[stack.length - 1] !== this.token) return;
    const target = event.target as Node | null;
    if (!target) return;
    if (this.panel()?.nativeElement.contains(target) || this.anchor()?.contains(target)) return;
    this.closed.emit();
  }

  private update(): void {
    const view = this.document.defaultView;
    const panel = this.panel()?.nativeElement;
    if (!view || !panel) return;
    const visual = view.visualViewport;
    if (this.modal()) {
      if (this.kind() !== 'bottom' && this.kind() !== 'center') return;
      const hidden = visual ? view.innerHeight - (visual.offsetTop + visual.height) : 0;
      this.keyboardOffset.set(Math.max(0, Math.round(hidden)));
      this.visibleHeight.set(visual ? Math.round(visual.height) : null);
      return;
    }
    const anchor = this.anchor();
    if (!anchor) return;
    const rect = anchor.getBoundingClientRect();
    const width = this.matchWidth() ? Math.max(rect.width, this.minWidth()) : this.panelWidth();
    this.width.set(width);
    if (width !== null) panel.style.width = `${width}px`;
    const natural = panel.scrollHeight || 0;
    const result = computePosition({
      anchor: rect,
      width: width ?? panel.offsetWidth,
      height: natural,
      viewport: {
        width: visual?.width ?? view.innerWidth,
        height: visual ? visual.offsetTop + visual.height : view.innerHeight,
      },
      align: this.align(),
      placement: this.placement(),
    });
    this.position.set(result);
    this.positioned.set(true);
  }
}
