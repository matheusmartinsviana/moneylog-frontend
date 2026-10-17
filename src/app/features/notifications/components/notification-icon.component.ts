import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { IconComponent } from '~/app/common/components/icon/icon.component';
import type { IconName } from '~/app/common/components/icon/icons';
import type { NotificationKind } from '~/modules/notifications/core/types/notification';

type Tone = 'accent' | 'positive' | 'warning' | 'risk' | 'neutral';

const VISUAL: Readonly<Partial<Record<NotificationKind, { icon: IconName; tone: Tone }>>> = {
  INVOICE_DUE: { icon: 'cards', tone: 'warning' },
  DEBT_COLLECT: { icon: 'plus', tone: 'positive' },
  DEBT_PAYABLE_DUE: { icon: 'minus', tone: 'risk' },
  RECURRENCE_PENDING: { icon: 'planning', tone: 'accent' },
  COMMITTED_NEXT_MONTH: { icon: 'calendar', tone: 'accent' },
  DAILY_SUMMARY: { icon: 'sparkle', tone: 'accent' },
  REMINDER: { icon: 'bell', tone: 'warning' },
  GOAL_DEADLINE: { icon: 'goals', tone: 'accent' },
  GROUPED: { icon: 'more', tone: 'neutral' },
  INVOICE_DUE_AUTODEBIT_OFF: { icon: 'cards', tone: 'warning' },
  NEGATIVE_MONTH_PROJECTED: { icon: 'calendar', tone: 'risk' },
  NEW_DEBT_BEFORE_FINANCING: { icon: 'minus', tone: 'warning' },
  CARD_CASH_OUT_COST: { icon: 'cards', tone: 'warning' },
  SUBSCRIPTION_OVERLAP: { icon: 'planning', tone: 'neutral' },
  SUBSCRIPTION_UNUSED: { icon: 'planning', tone: 'neutral' },
  WEEKLY_CHARGE: { icon: 'calendar', tone: 'neutral' },
  THIRD_PARTY_OVERDUE: { icon: 'plus', tone: 'warning' },
  BALANCE_BELOW_REAL_ESTATE: { icon: 'accounts', tone: 'risk' },
  DOCUMENT_DIVERGENCE: { icon: 'notes', tone: 'warning' },
};

const FALLBACK: { icon: IconName; tone: Tone } = { icon: 'bell', tone: 'neutral' };

@Component({
  selector: 'app-notification-icon',
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { 'aria-hidden': 'true', '[attr.data-tone]': 'visual().tone' },
  template: `<app-icon [name]="visual().icon" [size]="20" />`,
  styles: `
    :host {
      --tile-bg: var(--color-accent-soft);
      --tile-fg: var(--color-accent);
      display: inline-grid;
      flex: none;
      place-items: center;
      width: 2.5rem;
      height: 2.5rem;
      border-radius: var(--radius-icon);
      background-color: var(--tile-bg);
      color: var(--tile-fg);
    }

    :host([data-tone='positive']) {
      --tile-bg: var(--color-positive-soft);
      --tile-fg: var(--color-positive);
    }

    :host([data-tone='warning']) {
      --tile-bg: var(--color-warning-soft);
      --tile-fg: var(--color-warning);
    }

    :host([data-tone='risk']) {
      --tile-bg: var(--color-risk-soft);
      --tile-fg: var(--color-risk);
    }

    :host([data-tone='neutral']) {
      --tile-bg: var(--color-surface-muted);
      --tile-fg: var(--color-text-muted);
    }
  `,
})
export class NotificationIconComponent {
  readonly kind = input.required<NotificationKind>();

  protected readonly visual = computed(() => VISUAL[this.kind()] ?? FALLBACK);
}
