import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  Injector,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';

import { AvatarComponent } from '~/app/common/components/avatar/avatar.component';
import { IconComponent } from '~/app/common/components/icon/icon.component';
import type { IconName } from '~/app/common/components/icon/icons';
import { OverlayPanelComponent } from '~/app/common/components/overlay/overlay-panel.component';
import { TooltipDirective } from '~/app/common/components/tooltip/tooltip.directive';

export interface MenuItem {
  readonly id: string;
  readonly label: string;
  readonly disabled?: boolean;
  readonly destructive?: boolean;
  readonly checked?: boolean;
  readonly icon?: IconName;
}

let nextId = 0;

const normalize = (text: string): string =>
  text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();

@Component({
  selector: 'app-menu',
  imports: [AvatarComponent, IconComponent, OverlayPanelComponent, TooltipDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="menu" #wrapper>
      <button
        #trigger
        type="button"
        class="menu__trigger"
        aria-haspopup="menu"
        [class.menu__trigger--text]="showLabel()"
        [class.menu__trigger--avatar]="avatar()"
        [class.menu__trigger--rail]="variant() === 'rail'"
        [class.is-active]="active()"
        [class.is-open]="open()"
        [id]="triggerId"
        [attr.aria-expanded]="open()"
        [attr.aria-controls]="open() ? menuId : null"
        [attr.aria-label]="showLabel() ? null : label()"
        [attr.data-cy]="fieldId()"
        [disabled]="disabled()"
        [appTooltip]="variant() === 'rail' && !open() ? label() : null"
        appTooltipSide="end"
        [appTooltipDescribes]="false"
        (click)="toggle('first')"
        (keydown)="onTriggerKeydown($event)"
      >
        @if (showLabel()) {
          <span>{{ label() }}</span>
          <app-icon class="menu__chevron" name="chevronDown" [size]="16" />
        } @else if (avatar() && (avatarName() || avatarSrc())) {
          <app-avatar size="sm" [name]="avatarName()" [src]="avatarSrc()" />
        } @else {
          <app-icon [name]="icon()" [size]="20" />
        }
      </button>

      <app-overlay-panel
        [open]="open()"
        [anchor]="anchor()"
        [label]="label()"
        [popoverRole]="null"
        [align]="align()"
        [placement]="variant() === 'rail' ? 'inline' : 'block'"
        [cy]="fieldId() + '-panel'"
        (closed)="close()"
      >
        @if (open()) {
          <div
            class="menu__list"
            role="menu"
            [id]="menuId"
            [attr.aria-label]="label()"
            [attr.data-cy]="fieldId() + '-menu'"
          >
            @for (item of items(); track item.id; let i = $index) {
              <button
                type="button"
                class="menu__item"
                tabindex="-1"
                [class.menu__item--destructive]="item.destructive"
                [class.menu__item--check]="hasChecks()"
                [attr.role]="item.checked === undefined ? 'menuitem' : 'menuitemcheckbox'"
                [attr.aria-checked]="item.checked === undefined ? null : item.checked"
                [attr.aria-disabled]="item.disabled || null"
                [attr.data-autofocus]="i === startIndex() ? '' : null"
                data-menu-item
                [attr.data-cy]="fieldId() + '-item-' + item.id"
                (click)="choose(item)"
                (keydown)="onMenuKeydown($event)"
              >
                @if (item.icon) {
                  <app-icon class="menu__icon" [name]="item.icon" [size]="18" />
                }
                @if (hasChecks()) {
                  <span class="menu__check" aria-hidden="true">
                    @if (item.checked) {
                      <app-icon name="check" [size]="16" />
                    }
                  </span>
                }
                <span class="menu__label">{{ item.label }}</span>
              </button>
            }
          </div>
        }
      </app-overlay-panel>
    </div>
  `,
  styles: `
    :host {
      display: inline-block;
      min-width: 0;
    }

    .menu__trigger {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: var(--space-2);
      min-width: 2.75rem;
      min-height: 2.75rem;
      padding: 0 var(--space-3);
      border: var(--border-width) solid transparent;
      border-radius: var(--radius-control);
      background: transparent;
      color: var(--color-text-muted);
      font-size: var(--text-sm);
      font-weight: var(--weight-medium);
      -webkit-tap-highlight-color: transparent;
    }

    .menu__trigger--avatar {
      min-width: 2.75rem;
      width: 2.75rem;
      min-height: 2.75rem;
      height: 2.75rem;
      padding: 0;
      border-color: var(--btn-glass-border);
      border-radius: 50%;
      background-color: var(--btn-glass-solid);
      background-image: var(--btn-soft-bg);
      box-shadow: var(--btn-glass-shadow);
      color: var(--color-accent);
      transition:
        background-image var(--duration-fast) var(--ease-standard),
        box-shadow var(--duration-base) var(--ease-standard);
    }

    .menu__trigger--avatar:hover:not(:disabled),
    .menu__trigger--avatar.is-open {
      background-image: var(--btn-glass-bg-hover);
      box-shadow: var(--btn-glass-shadow-hover);
      color: var(--color-text);
    }

    .menu__trigger--rail {
      width: 2.5rem;
      min-width: 2.5rem;
      height: 2.5rem;
      min-height: 2.5rem;
      padding: 0;
      border-color: var(--rail-pill-border);
      border-radius: var(--radius-rail-pill);
      background-color: var(--rail-pill-bg);
      color: var(--color-text);
    }

    @media (pointer: coarse) {
      .menu__trigger--rail {
        width: var(--touch-min);
        min-width: var(--touch-min);
        height: var(--touch-min);
        min-height: var(--touch-min);
      }
    }

    .menu__trigger--rail.is-active {
      border-color: transparent;
      background-color: transparent;
      color: var(--color-text);
    }

    .menu__trigger--rail.is-active:hover:not(:disabled),
    .menu__trigger--rail.is-active.is-open {
      border-color: transparent;
      background-color: transparent;
      background-image: none;
      color: var(--color-text);
    }

    .menu__trigger--rail:focus-visible {
      outline: none;
      box-shadow: var(--focus-ring);
    }

    .menu__icon {
      flex: none;
      color: var(--color-text-muted);
    }

    .menu__trigger--text {
      border-color: var(--color-control-border);
      background-color: var(--color-surface);
      color: var(--color-text);
    }

    .menu__trigger:hover:not(:disabled),
    .menu__trigger.is-open {
      background-color: var(--color-hover-soft);
      color: var(--color-text);
    }

    .menu__trigger--rail:hover:not(:disabled),
    .menu__trigger--rail.is-open {
      border-color: var(--rail-pill-border);
      background-color: var(--rail-pill-hover);
      background-image: none;
    }

    .menu__trigger:disabled {
      opacity: 0.55;
      cursor: not-allowed;
    }

    .menu__chevron {
      color: var(--color-text-muted);
    }

    .menu__list {
      display: flex;
      flex-direction: column;
      min-width: 12rem;
      padding: var(--space-1);
      overflow-y: auto;
    }

    .menu__item {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      width: 100%;
      min-height: 2.25rem;
      padding: 0 var(--space-3);
      border: 0;
      border-radius: calc(var(--radius-control) - 2px);
      background: transparent;
      color: var(--color-text);
      font-size: var(--text-sm);
      text-align: left;
      white-space: nowrap;
      -webkit-tap-highlight-color: transparent;
    }

    @media (width <= 640px), (pointer: coarse) {
      .menu__item {
        min-height: var(--touch-min);
      }
    }

    .menu__item:hover:not([aria-disabled='true']),
    .menu__item:focus-visible {
      background-color: var(--color-hover-soft);
    }

    .menu__item[aria-disabled='true'] {
      opacity: 0.55;
      cursor: not-allowed;
    }

    .menu__item--destructive {
      color: var(--color-risk);
    }

    .menu__label {
      min-width: 0;
      flex: 1;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .menu__check {
      display: inline-grid;
      flex: none;
      place-items: center;
      width: 1rem;
      height: 1rem;
      color: var(--color-accent);
    }

    @media (width <= 640px), (pointer: coarse) {
      .menu__trigger--avatar {
        width: 2.75rem;
        height: 2.75rem;
        min-height: 2.75rem;
      }

      .menu__item {
        min-height: 2.75rem;
        font-size: var(--text-md);
      }

      .menu__list {
        min-width: 0;
      }
    }

    @media (forced-colors: active) {
      .menu__item:focus-visible {
        outline: 2px solid Highlight;
      }
    }
  `,
})
export class MenuComponent {
  private readonly injector = inject(Injector);

  readonly label = input.required<string>();
  readonly fieldId = input.required<string>();
  readonly items = input.required<readonly MenuItem[]>();
  readonly icon = input<IconName>('more');
  readonly avatar = input(false);
  readonly avatarName = input<string | null>(null);
  readonly avatarSrc = input<string | null>(null);
  readonly showLabel = input(false);
  readonly variant = input<'default' | 'rail'>('default');
  readonly active = input(false);
  readonly align = input<'start' | 'end'>('end');
  readonly disabled = input(false);

  readonly selected = output<string>();

  private readonly uid = ++nextId;
  protected readonly triggerId = `menu-trigger-${this.uid}`;
  protected readonly menuId = `menu-${this.uid}`;

  private readonly wrapper = viewChild<ElementRef<HTMLElement>>('wrapper');
  private readonly trigger = viewChild<ElementRef<HTMLButtonElement>>('trigger');
  protected readonly anchor = computed(() => this.wrapper()?.nativeElement ?? null);

  protected readonly open = signal(false);
  private readonly initial = signal<'first' | 'last'>('first');
  private typed = '';
  private typedAt = 0;

  protected readonly hasChecks = computed(() => this.items().some((i) => i.checked !== undefined));
  protected readonly startIndex = computed(() => {
    const items = this.items();
    const indexes = items.map((_, i) => i).filter((i) => !items[i]?.disabled);
    return (this.initial() === 'first' ? indexes[0] : indexes[indexes.length - 1]) ?? -1;
  });

  protected toggle(initial: 'first' | 'last'): void {
    if (this.disabled()) return;
    if (this.open()) {
      this.close();
      return;
    }
    this.initial.set(initial);
    this.open.set(true);
  }

  protected close(): void {
    this.open.set(false);
  }

  protected onTriggerKeydown(event: KeyboardEvent): void {
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
    event.preventDefault();
    if (this.open()) return;
    this.toggle(event.key === 'ArrowDown' ? 'first' : 'last');
  }

  protected choose(item: MenuItem): void {
    if (item.disabled) return;
    if (item.checked !== undefined) {
      this.selected.emit(item.id);
      return;
    }
    this.close();
    afterNextRender(
      () => {
        this.trigger()?.nativeElement.focus();
        this.selected.emit(item.id);
      },
      { injector: this.injector },
    );
  }

  protected onMenuKeydown(event: KeyboardEvent): void {
    const menu = (event.currentTarget as HTMLElement).closest<HTMLElement>('[role="menu"]');
    if (!menu) return;
    const items = Array.from(
      menu.querySelectorAll<HTMLElement>('[data-menu-item]:not([aria-disabled="true"])'),
    );
    if (items.length === 0) return;
    const current = items.indexOf(event.target as HTMLElement);
    let target: number;
    switch (event.key) {
      case 'ArrowDown':
        target = (current + 1) % items.length;
        break;
      case 'ArrowUp':
        target = current <= 0 ? items.length - 1 : current - 1;
        break;
      case 'Home':
        target = 0;
        break;
      case 'End':
        target = items.length - 1;
        break;
      default:
        if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
          if (event.key === ' ' && Date.now() - this.typedAt > 500) return;
          target = this.typeahead(items, current, event.key);
          if (target < 0) return;
          break;
        }
        return;
    }
    event.preventDefault();
    items[target]?.focus();
  }

  private typeahead(items: readonly HTMLElement[], current: number, key: string): number {
    const now = Date.now();
    this.typed = now - this.typedAt > 500 ? key : this.typed + key;
    this.typedAt = now;
    const query = normalize(this.typed);
    const from = this.typed.length === 1 ? current + 1 : Math.max(current, 0);
    for (let i = 0; i < items.length; i++) {
      const index = (from + i) % items.length;
      if (normalize(items[index]?.textContent?.trim() ?? '').startsWith(query)) {
        return index;
      }
    }
    return -1;
  }
}
