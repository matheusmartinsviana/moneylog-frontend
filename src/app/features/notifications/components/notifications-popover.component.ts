import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  Injector,
  signal,
  viewChild,
} from '@angular/core';
import { RouterLink } from '@angular/router';

import { IconComponent } from '~/app/common/components/icon/icon.component';
import { LiquidGlassDirective } from '~/app/common/components/liquid-glass/liquid-glass.directive';
import { OverlayPanelComponent } from '~/app/common/components/overlay/overlay-panel.component';
import { HTML_LANG } from '~/app/common/i18n/i18n';
import { I18nService } from '~/app/common/i18n/i18n.service';
import { interpolate } from '~/app/common/i18n/interpolate';
import { ValuesVisibilityService } from '~/app/common/services/values-visibility.service';
import { NotificationIconComponent } from '~/app/features/notifications/components/notification-icon.component';
import {
  kindLabel,
  notificationLink,
  notificationText,
} from '~/app/features/notifications/notification-text';
import { NotificationsCenterFacade } from '~/modules/notifications/core/facades/notifications-center.facade';
import { UnreadCountFacade } from '~/modules/notifications/core/facades/unread-count.facade';
import type { AppNotification } from '~/modules/notifications/core/types/notification';

export const POPOVER_LIMIT = 4;

const RELATIVE_STEPS: readonly (readonly [Intl.RelativeTimeFormatUnit, number])[] = [
  ['year', 31_536_000],
  ['month', 2_592_000],
  ['day', 86_400],
  ['hour', 3_600],
  ['minute', 60],
];

function relativeTime(iso: string, locale: string): string {
  const seconds = Math.round((new Date(iso).getTime() - Date.now()) / 1000);
  if (Number.isNaN(seconds)) return '';
  const formatter = new Intl.RelativeTimeFormat(locale, { numeric: 'auto', style: 'short' });
  const step = RELATIVE_STEPS.find(([, size]) => Math.abs(seconds) >= size);
  if (!step) return formatter.format(0, 'minute');
  return formatter.format(Math.round(seconds / step[1]), step[0]);
}

@Component({
  selector: 'app-notifications-popover',
  imports: [
    IconComponent,
    LiquidGlassDirective,
    NotificationIconComponent,
    OverlayPanelComponent,
    RouterLink,
  ],
  providers: [NotificationsCenterFacade],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div #wrapper class="np">
      <button
        #trigger
        type="button"
        class="icon-button np__bell"
        appLiquidGlass
        aria-haspopup="dialog"
        data-cy="header-bell"
        [attr.aria-expanded]="open()"
        [attr.aria-label]="bellLabel()"
        (click)="toggle()"
      >
        <app-icon name="bell" [size]="20" />
        @if ((unreadCount() ?? 0) > 0) {
          <span class="np__count num" aria-hidden="true" data-cy="header-bell-count">{{
            unreadCount()
          }}</span>
        }
      </button>

      <app-overlay-panel
        [open]="open()"
        [anchor]="anchor()"
        [label]="t().notifications.popover.title"
        [align]="'end'"
        [minWidth]="320"
        [panelWidth]="400"
        [maxHeight]="480"
        layout="sheet"
        cy="header-notifications"
        (closed)="close()"
      >
        @if (open()) {
          <div class="np__body" data-cy="notifications-popover">
            <header class="np__header">
              <h2 class="np__title">{{ t().notifications.popover.title }}</h2>
              <button
                type="button"
                class="np__link"
                data-cy="notifications-popover-mark-all"
                [disabled]="!hasUnread()"
                (click)="center.markAllRead()"
              >
                {{ t().notifications.center.markAllRead }}
              </button>
            </header>

            @switch (center.state().status) {
              @case ('loading') {
                <div data-cy="notifications-popover-loading">
                  <p class="visually-hidden" role="status">
                    {{ t().notifications.center.loading }}
                  </p>
                  <div class="np__skeleton" aria-hidden="true">
                    @for (row of [1, 2, 3]; track row) {
                      <div class="np__sk-row">
                        <span class="sk np__sk-tile"></span>
                        <span class="np__sk-text">
                          <span class="sk np__sk-line np__sk-line--kind">&nbsp;</span>
                          <span class="sk np__sk-line np__sk-line--title">&nbsp;</span>
                          <span class="sk np__sk-line np__sk-line--body">&nbsp;</span>
                        </span>
                      </div>
                    }
                  </div>
                </div>
              }
              @case ('empty') {
                <p class="np__note" data-cy="notifications-popover-empty">
                  {{ t().notifications.popover.empty }}
                </p>
              }
              @case ('error') {
                <div class="np__error" role="alert" data-cy="notifications-popover-error">
                  <p>{{ t().notifications.popover.error }}</p>
                  <button
                    type="button"
                    class="button"
                    data-cy="notifications-popover-retry"
                    (click)="center.load()"
                  >
                    {{ t().notifications.popover.retry }}
                  </button>
                </div>
              }
              @case ('ready') {
                <ul class="np__list" data-cy="notifications-popover-list">
                  @for (item of items(); track item.id) {
                    <li>
                      <a
                        class="np__item row-hover"
                        [class.is-unread]="item.unread"
                        [routerLink]="item.link"
                        data-cy="notifications-popover-item"
                        (click)="close(false)"
                      >
                        @if (item.unread) {
                          <span class="np__dot" aria-hidden="true"></span>
                        }
                        <app-notification-icon class="np__icon" [kind]="item.rawKind" />
                        <span class="np__main">
                          <span class="np__meta">
                            <span class="np__kind">
                              {{ item.kind }}
                              @if (item.unread) {
                                <span
                                  class="np__badge visually-hidden"
                                  data-cy="notifications-popover-unread"
                                  >{{ t().notifications.center.unreadMark }}</span
                                >
                              }
                            </span>
                            <span class="np__time num">{{ item.when }}</span>
                          </span>
                          <span class="np__item-title">{{ item.title }}</span>
                          <span class="np__item-body">{{ item.body }}</span>
                        </span>
                      </a>
                    </li>
                  }
                </ul>
              }
            }

            <footer class="np__footer">
              <a
                class="np__all"
                routerLink="/notifications"
                data-autofocus
                data-cy="notifications-popover-all"
                (click)="close(false)"
              >
                {{ t().notifications.popover.viewAll }}
              </a>
            </footer>
          </div>
        }
      </app-overlay-panel>
    </div>
  `,
  styles: `
    :host {
      display: inline-flex;
    }

    .np {
      position: relative;
      display: inline-flex;
    }

    .np__bell:focus-visible {
      outline: none;
      box-shadow: var(--focus-ring);
    }

    .np__count {
      position: absolute;
      top: -0.25rem;
      right: -0.25rem;
      min-width: 1.125rem;
      height: 1.125rem;
      padding: 0 0.3125rem;
      border-radius: var(--radius-pill);
      background-color: var(--color-accent);
      color: var(--color-on-accent);
      font-size: 0.6875rem;
      font-weight: var(--weight-semibold);
      line-height: 1.125rem;
      text-align: center;
    }

    .np__body {
      display: grid;
      min-width: 0;
      padding: var(--space-2) 0 0;
    }

    .np__header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--space-3);
      padding: var(--space-1) var(--space-4) var(--space-2);
    }

    .np__title {
      font-size: var(--text-md);
      font-weight: var(--weight-semibold);
      line-height: 1.5rem;
    }

    @media (width <= 640px) {
      .np__title {
        display: none;
      }

      .np__header {
        justify-content: flex-end;
      }
    }

    .np__link {
      min-height: 2rem;
      padding: 0 var(--space-2);
      margin-right: calc(var(--space-2) * -1);
      border: 0;
      border-radius: var(--radius-control);
      background: transparent;
      color: var(--color-accent);
      font-size: var(--text-xs);
      font-weight: var(--weight-medium);
    }

    .np__link:hover:not(:disabled) {
      background-color: var(--color-accent-soft);
    }

    .np__link:disabled {
      color: var(--color-text-muted);
      cursor: not-allowed;
    }

    @media (width <= 767px), (pointer: coarse) {
      .np__link {
        min-height: var(--touch-min);
      }
    }

    .np__list {
      display: grid;
      margin: 0;
      padding: 0 var(--space-2);
      list-style: none;
    }

    .np__list > li + li {
      border-top: var(--border-width) solid var(--color-border);
    }

    .np__item {
      position: relative;
      display: flex;
      align-items: center;
      gap: var(--space-3);
      padding: var(--space-2) var(--space-3) var(--space-2) var(--space-4);
      border-radius: var(--radius-icon);
      color: inherit;
      text-decoration: none;
    }

    .np__icon {
      width: 2rem;
      height: 2rem;
      border-radius: var(--radius-control);
    }

    .np__dot {
      position: absolute;
      top: 50%;
      left: 0.375rem;
      width: 0.375rem;
      height: 0.375rem;
      border-radius: var(--radius-pill);
      background-color: var(--color-accent);
      transform: translateY(-50%);
    }

    .np__main {
      display: grid;
      flex: 1 1 auto;
      gap: 1px;
      min-width: 0;
    }

    .np__meta {
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      gap: var(--space-2);
      color: var(--color-text-muted);
      font-size: 0.6875rem;
    }

    .np__kind,
    .np__time {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .np__time {
      flex: none;
    }

    .np__item-title {
      overflow: hidden;
      font-size: var(--text-sm);
      font-weight: var(--weight-medium);
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .np__item.is-unread .np__item-title {
      font-weight: var(--weight-semibold);
    }

    .np__item-body {
      overflow: hidden;
      color: var(--color-text-muted);
      font-size: var(--text-xs);
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .np__note,
    .np__error {
      padding: var(--space-3) var(--space-4);
      color: var(--color-text-muted);
      font-size: var(--text-sm);
    }

    .np__error {
      display: grid;
      justify-items: start;
      gap: var(--space-3);
    }

    .np__skeleton {
      display: grid;
      gap: 2px;
    }

    .np__sk-row {
      display: flex;
      align-items: flex-start;
      gap: var(--space-3);
      padding: var(--space-2) var(--space-3) var(--space-2) var(--space-4);
    }

    .np__sk-tile {
      display: block;
      flex: none;
      width: 2rem;
      height: 2rem;
      border-radius: var(--radius-control);
    }

    .np__sk-text {
      display: grid;
      flex: 1;
      gap: 2px;
      min-width: 0;
      font-size: var(--text-sm);
    }

    .np__sk-line {
      display: block;
      width: 70%;
    }

    .np__sk-line--kind {
      width: 30%;
      font-size: var(--text-xs);
    }

    .np__sk-line--title {
      width: 50%;
      font-size: var(--text-sm);
    }

    .np__sk-line--body {
      font-size: var(--text-xs);
    }

    .np__footer {
      display: grid;
      margin-top: var(--space-1);
      border-top: var(--border-width) solid var(--color-border);
    }

    .np__all {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      min-height: 2.75rem;
      color: var(--color-accent);
      font-size: var(--text-sm);
      font-weight: var(--weight-medium);
      text-decoration: none;
      transition: background-color var(--duration-fast) var(--ease-standard);
    }

    .np__all:hover {
      background-color: var(--color-accent-soft);
    }

    .np__all:focus-visible {
      outline: none;
      box-shadow: inset var(--focus-ring);
    }
  `,
})
export class NotificationsPopoverComponent {
  private readonly visibility = inject(ValuesVisibilityService);
  private readonly i18n = inject(I18nService);
  private readonly unread = inject(UnreadCountFacade);
  private readonly injector = inject(Injector);
  protected readonly center = inject(NotificationsCenterFacade);
  protected readonly t = this.i18n.t;

  private readonly wrapper = viewChild<ElementRef<HTMLElement>>('wrapper');
  private readonly trigger = viewChild<ElementRef<HTMLButtonElement>>('trigger');
  protected readonly anchor = computed(() => this.wrapper()?.nativeElement ?? null);
  protected readonly open = signal(false);

  protected readonly unreadCount = this.unread.count;
  protected readonly bellLabel = computed(() => {
    const copy = this.t().notifications.bell;
    const count = this.unread.count() ?? 0;
    if (count <= 0) return copy.label;
    return count === 1 ? copy.one : interpolate(copy.many, { count: String(count) });
  });

  private readonly all = computed<readonly AppNotification[]>(() => {
    const state = this.center.state();
    return state.status === 'ready' ? state.data : [];
  });
  protected readonly hasUnread = computed(() => this.all().some((n) => n.readAt === null));
  protected readonly items = computed(() => {
    const copy = this.t().notifications;
    const locale = HTML_LANG[this.i18n.language()];
    const hidden = this.visibility.hidden();
    return this.all()
      .slice(0, POPOVER_LIMIT)
      .map((n) => {
        const text = notificationText(n, copy, locale, hidden);
        return {
          id: n.id,
          kind: kindLabel(copy, n.kind),
          rawKind: n.kind,
          title: text.title,
          body: text.body,
          when: relativeTime(n.createdAt, locale),
          unread: n.readAt === null,
          link: notificationLink(n),
        };
      });
  });

  protected toggle(): void {
    if (this.open()) {
      this.close();
      return;
    }
    this.center.load({ status: 'ALL', kind: null });
    this.open.set(true);
  }

  protected close(restoreFocus = true): void {
    if (!this.open()) return;
    this.open.set(false);
    if (!restoreFocus) return;
    afterNextRender(() => this.trigger()?.nativeElement.focus(), { injector: this.injector });
  }
}
