import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';

import { IconComponent } from '~/app/common/components/icon/icon.component';
import { IconName } from '~/app/common/components/icon/icons';
import { I18nService } from '~/app/common/i18n/i18n.service';

export type StatusTagKind =
  | 'EXPENSE'
  | 'CARD_PURCHASE'
  | 'INCOME'
  | 'REFUND'
  | 'TRANSFER'
  | 'CONTRIBUTION'
  | 'REDEMPTION'
  | 'INVOICE_PAYMENT'
  | 'LOAN_GIVEN'
  | 'MONEY_RECEIVED'
  | 'DEBT_PAYMENT'
  | 'ADJUSTMENT'
  | 'UNKNOWN'
  | 'SCHEDULED'
  | 'VOIDED';

export type StatusTagTone = 'expense' | 'income' | 'neutral';

export const STATUS_TAG_ICON: Readonly<Record<StatusTagKind, IconName>> = {
  EXPENSE: 'arrowOut',
  CARD_PURCHASE: 'cards',
  INCOME: 'arrowIn',
  REFUND: 'arrowReturn',
  TRANSFER: 'arrowsOpposite',
  CONTRIBUTION: 'chart',
  REDEMPTION: 'chart',
  INVOICE_PAYMENT: 'cards',
  LOAN_GIVEN: 'person',
  MONEY_RECEIVED: 'person',
  DEBT_PAYMENT: 'person',
  ADJUSTMENT: 'adjust',
  UNKNOWN: 'generic',
  SCHEDULED: 'calendar',
  VOIDED: 'minus',
};

export const STATUS_TAG_ALLOWED_TONE: Readonly<Record<StatusTagKind, StatusTagTone>> = {
  EXPENSE: 'expense',
  CARD_PURCHASE: 'expense',
  INCOME: 'income',
  REFUND: 'neutral',
  TRANSFER: 'neutral',
  CONTRIBUTION: 'neutral',
  REDEMPTION: 'neutral',
  INVOICE_PAYMENT: 'neutral',
  LOAN_GIVEN: 'neutral',
  MONEY_RECEIVED: 'neutral',
  DEBT_PAYMENT: 'neutral',
  ADJUSTMENT: 'neutral',
  UNKNOWN: 'neutral',
  SCHEDULED: 'neutral',
  VOIDED: 'neutral',
};

@Component({
  selector: 'app-status-tag',
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="tag" [attr.data-tone]="effectiveTone()" [attr.data-cy]="cy()">
      <app-icon class="tag__icon" [name]="icon()" [size]="14" />
      <span class="tag__label">{{ label() }}</span>
    </span>
  `,
  styles: `
    :host {
      display: inline-flex;
      max-width: 100%;
    }

    .tag {
      display: inline-flex;
      align-items: center;
      gap: var(--space-1);
      max-width: 100%;
      min-height: 1.5rem;
      padding: 0 var(--space-2);
      border: var(--border-width) solid var(--glass-panel-border);
      border-radius: var(--radius-pill);
      color: var(--color-neutral-text);
      font-size: var(--text-xs);
      line-height: var(--leading-tight);
    }

    .tag__icon {
      color: var(--color-neutral-mark);
    }

    .tag[data-tone='income'] {
      color: var(--color-income-text);
    }

    .tag[data-tone='income'] .tag__icon {
      color: var(--color-income-mark);
    }

    .tag[data-tone='expense'] {
      color: var(--color-expense-text);
    }

    .tag[data-tone='expense'] .tag__icon {
      color: var(--color-expense-mark);
    }

    .tag__label {
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  `,
})
export class StatusTagComponent {
  private readonly i18n = inject(I18nService);

  readonly kind = input.required<StatusTagKind>();
  readonly tone = input<StatusTagTone>('neutral');
  readonly cy = input('status-tag');

  protected readonly effectiveTone = computed<StatusTagTone>(() =>
    this.tone() === STATUS_TAG_ALLOWED_TONE[this.kind()] ? this.tone() : 'neutral',
  );
  protected readonly icon = computed(() => STATUS_TAG_ICON[this.kind()]);
  protected readonly label = computed(() => this.i18n.t().glass.status[this.kind()]);
}
