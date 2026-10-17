import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';

import { HTML_LANG } from '~/app/common/i18n/i18n';
import { I18nService } from '~/app/common/i18n/i18n.service';
import { ValuesVisibilityService } from '~/app/common/services/values-visibility.service';
import { NotificationIconComponent } from '~/app/features/notifications/components/notification-icon.component';
import {
  kindLabel,
  notificationLink,
  notificationText,
} from '~/app/features/notifications/notification-text';
import type { AppNotification } from '~/modules/notifications/core/types/notification';

@Component({
  selector: 'li[app-notification-row]',
  imports: [NotificationIconComponent, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'row', '[class.row--unread]': 'unread()', '[attr.data-cy]': '"notification-row"' },
  template: `
    @if (unread()) {
      <span class="row__dot" aria-hidden="true"></span>
    }
    <app-notification-icon [kind]="notification().kind" />
    <div class="row__main">
      <p class="row__kind">
        {{ kindLabel() }}
        @if (unread()) {
          <span class="row__badge visually-hidden" data-cy="notification-unread">{{
            t().notifications.center.unreadMark
          }}</span>
        }
      </p>
      <p class="row__title" data-cy="notification-title">{{ text().title }}</p>
      <p class="row__body" data-cy="notification-body">{{ text().body }}</p>
      <div class="row__actions">
        <a
          class="row__action row__action--primary hit"
          [routerLink]="link()"
          data-cy="notification-open"
        >
          {{ t().notifications.center.open }}
        </a>
        @if (unread()) {
          <button
            type="button"
            class="row__action hit"
            data-cy="notification-mark-read"
            (click)="markRead.emit()"
          >
            {{ t().notifications.center.markRead }}
          </button>
        }
      </div>
    </div>
  `,
  styles: `
    :host {
      position: relative;
      display: grid;
      grid-template-columns: auto minmax(0, 1fr);
      align-items: start;
      gap: var(--space-3);
      padding: var(--space-3) var(--space-4);
      list-style: none;
    }

    .row__dot {
      position: absolute;
      top: calc(var(--space-3) + 1.25rem);
      left: calc(var(--space-4) / 2);
      translate: -50% -50%;
      width: 0.5rem;
      height: 0.5rem;
      border-radius: var(--radius-pill);
      background-color: var(--color-accent);
    }

    .row__main {
      display: grid;
      gap: 2px;
      min-width: 0;
    }

    .row__kind {
      color: var(--color-text-muted);
      font-size: var(--text-xs);
    }

    .row__title {
      font-weight: var(--weight-medium);
      overflow-wrap: anywhere;
    }

    :host(.row--unread) .row__title {
      font-weight: var(--weight-semibold);
    }

    .row__body {
      color: var(--color-text-muted);
      font-size: var(--text-sm);
      overflow-wrap: anywhere;
    }

    .row__actions {
      display: flex;
      flex-wrap: wrap;
      gap: var(--space-2);
      margin-top: var(--space-2);
    }

    .row__action {
      display: inline-flex;
      align-items: center;
      min-height: 2.25rem;
      padding: 0 var(--space-3);
      border: 0;
      border-radius: var(--radius-pill);
      background: transparent;
      color: var(--color-text-muted);
      font-size: var(--text-sm);
      font-weight: var(--weight-medium);
      text-decoration: none;
      transition: background-color var(--duration-fast) var(--ease-standard);
    }

    .row__action:hover {
      background-color: var(--color-hover-soft);
    }

    .row__action--primary {
      background-color: var(--color-accent-soft);
      color: var(--color-accent);
    }

    .row__action--primary:hover {
      background-color: var(--color-accent-soft-hover);
    }
  `,
})
export class NotificationRowComponent {
  private readonly i18n = inject(I18nService);
  private readonly visibility = inject(ValuesVisibilityService);
  protected readonly t = this.i18n.t;

  readonly notification = input.required<AppNotification>();
  readonly markRead = output<void>();

  protected readonly unread = computed(() => this.notification().readAt === null);
  protected readonly text = computed(() =>
    notificationText(
      this.notification(),
      this.t().notifications,
      HTML_LANG[this.i18n.language()],
      this.visibility.hidden(),
    ),
  );
  protected readonly kindLabel = computed(() =>
    kindLabel(this.t().notifications, this.notification().kind),
  );
  protected readonly link = computed(() => notificationLink(this.notification()));
}
