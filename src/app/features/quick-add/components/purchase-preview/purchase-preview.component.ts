import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';

import { MoneyComponent } from '~/app/common/components/money/money.component';
import { HTML_LANG } from '~/app/common/i18n/i18n';
import { I18nService } from '~/app/common/i18n/i18n.service';
import { interpolate } from '~/app/common/i18n/interpolate';
import { problemMessage } from '~/app/common/i18n/problem-message';
import type { PurchasePreview } from '~/modules/cards/core/types/purchase-preview';
import type { Problem } from '~/util/api/problem';
import { formatCompetenceShort, formatIsoDate } from '~/util/date';
import type { PersonRef } from '~/util/debt';
import { isPositive } from '~/util/money';

@Component({
  selector: 'app-purchase-preview',
  imports: [MoneyComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="preview" aria-live="polite" data-cy="purchase-preview">
      <h2 class="preview__title">{{ t().cards.purchase.preview.title }}</h2>
      @if (loading()) {
        <p data-cy="purchase-preview-loading">{{ t().cards.purchase.preview.loading }}</p>
      } @else if (problem(); as failure) {
        <p data-cy="purchase-preview-unavailable">{{ errorText() }}</p>
      } @else if (preview(); as data) {
        <p class="preview__summary" data-cy="purchase-preview-summary">{{ summary() }}</p>

        <ul class="installments" [attr.aria-label]="t().cards.purchase.preview.list">
          @for (row of rows(); track row.number) {
            <li class="installment" data-cy="purchase-preview-installment">
              <span class="num">{{ row.label }}</span>
              <span class="installment__invoice">{{ row.invoice }}</span>
              <span class="installment__amount"><app-money [value]="row.amount" /></span>
              @if (row.split) {
                <span class="installment__split" data-cy="purchase-preview-split">
                  <span class="installment__part">
                    {{ t().cards.purchase.preview.mine }}
                    <app-money [value]="row.split.mine" />
                  </span>
                  @for (part of row.split.people; track $index) {
                    <span class="installment__part">
                      {{ part.name }}
                      <app-money [value]="part.amount" />
                    </span>
                  }
                </span>
              }
            </li>
          }
        </ul>

        <dl class="ledger">
          <div class="ledger__row">
            <dt class="ledger__label">{{ t().cards.purchase.preview.total }}</dt>
            <dd class="ledger__value" data-cy="purchase-preview-total">
              <app-money [value]="data.total" />
            </dd>
          </div>
          @if (data.availableLimitAfter; as availableAfter) {
            <div class="ledger__row">
              <dt class="ledger__label">{{ t().cards.purchase.preview.availableAfter }}</dt>
              <dd
                class="ledger__value"
                [class.is-negative]="data.overLimit"
                data-cy="purchase-preview-available-after"
              >
                <app-money [value]="availableAfter" />
              </dd>
            </div>
          } @else {
            <p class="note" data-cy="purchase-preview-limit-unset">{{ t().cards.limit.notSet }}</p>
          }
        </dl>

        @for (warning of data.warnings; track warning) {
          @if (warningText(warning); as text) {
            <p class="warning" role="status" [attr.data-cy]="'purchase-warning-' + warning">
              {{ text }}
              @if (warning === 'LATE_ENTRY') {
                <span class="warning__hint">{{
                  t().cards.purchase.preview.warnings.LATE_ENTRY_HINT
                }}</span>
              }
            </p>
          }
        }
      }
    </section>
  `,
  styles: `
    :host {
      display: block;
    }

    .preview {
      display: grid;
      gap: var(--space-3);
      padding: var(--space-4);
      border: var(--border-width) solid var(--color-border);
      border-radius: var(--radius-card);
      background-color: var(--color-surface-muted);
      font-size: var(--text-sm);
    }

    .preview__title {
      font-size: var(--text-sm);
      font-weight: var(--weight-semibold);
    }

    .preview__summary {
      font-weight: var(--weight-medium);
    }

    .installments {
      display: grid;
      max-height: 14rem;
      margin: 0;
      padding: 0;
      overflow-y: auto;
      list-style: none;
    }

    .installment {
      display: grid;
      grid-template-columns: auto minmax(0, 1fr) auto;
      align-items: baseline;
      gap: var(--space-3);
      padding: var(--space-1) 0;
      border-bottom: var(--border-width) solid var(--color-border);
    }

    .installment:last-child {
      border-bottom: 0;
    }

    .installment__split {
      display: flex;
      flex-wrap: wrap;
      grid-column: 1 / -1;
      gap: var(--space-1) var(--space-3);
      color: var(--color-text-muted);
      font-size: var(--text-xs);
    }

    .installment__part {
      display: inline-flex;
      gap: var(--space-1);
    }

    .installment__invoice {
      color: var(--color-text-muted);
      font-size: var(--text-xs);
    }

    .warning {
      color: var(--color-warning);
      font-weight: var(--weight-medium);
    }

    .warning[data-cy='purchase-warning-OVER_LIMIT'] {
      color: var(--color-risk);
    }

    .warning__hint {
      display: block;
      color: var(--color-text-muted);
      font-size: var(--text-xs);
      font-weight: var(--weight-regular);
    }
  `,
})
export class PurchasePreviewComponent {
  private readonly i18n = inject(I18nService);
  protected readonly t = this.i18n.t;

  readonly preview = input<PurchasePreview | null>(null);
  readonly loading = input(false);
  readonly problem = input<Problem | null>(null);
  readonly people = input<readonly PersonRef[]>([]);

  private readonly locale = computed(() => HTML_LANG[this.i18n.language()]);

  protected readonly errorText = computed(() => {
    const problem = this.problem();
    return problem && problem.status >= 400 && problem.status < 500
      ? problemMessage(problem, this.t().errors)
      : this.t().cards.purchase.preview.unavailable;
  });

  protected warningText(warning: string): string | null {
    const warnings: Readonly<Record<string, string>> = this.t().cards.purchase.preview.warnings;
    return Object.hasOwn(warnings, warning) ? (warnings[warning] ?? null) : null;
  }

  protected readonly rows = computed(() => {
    const copy = this.t().cards.purchase.preview;
    const people = this.people();
    return (this.preview()?.installments ?? []).map((installment) => ({
      number: installment.number,
      amount: installment.amount,
      split: isPositive(installment.thirdPartyAmount)
        ? {
            mine: installment.myAmount,
            people: installment.byPerson
              .filter((part) => part.personId !== null)
              .map((part) => ({
                name:
                  people.find((person) => person.id === part.personId)?.name ?? copy.otherPerson,
                amount: part.amount,
              })),
          }
        : null,
      label: interpolate(copy.installment, {
        number: String(installment.number),
        total: String(installment.total),
      }),
      invoice: interpolate(copy.invoice, {
        month: formatCompetenceShort(installment.invoice.referenceMonth, this.locale()),
        date: formatIsoDate(installment.invoice.dueDate, this.locale()),
      }),
    }));
  });

  protected readonly summary = computed(() => {
    const preview = this.preview();
    const first = preview?.installments[0];
    if (!preview || !first) return '';
    const copy = this.t().cards.purchase.preview;
    const params = {
      month: formatCompetenceShort(first.invoice.referenceMonth, this.locale()),
      date: formatIsoDate(first.invoice.dueDate, this.locale()),
    };
    return preview.installments.length === 1
      ? interpolate(copy.summaryOne, params)
      : interpolate(copy.summaryMany, {
          ...params,
          count: String(preview.installments.length),
        });
  });
}
