import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { MoneyComponent } from '~/app/common/components/money/money.component';
import { HTML_LANG } from '~/app/common/i18n/i18n';
import { I18nService } from '~/app/common/i18n/i18n.service';
import { interpolate } from '~/app/common/i18n/interpolate';
import { InvoiceStatusComponent } from '~/app/features/cards/components/invoice-status/invoice-status.component';
import type { InvoiceSummary } from '~/modules/cards/core/types/invoice';
import { formatCompetenceShort, formatIsoDate } from '~/util/date';

@Component({
  selector: 'li[app-invoice-summary-row]',
  imports: [RouterLink, MoneyComponent, InvoiceStatusComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'row', '[attr.data-cy]': "'invoice-row-' + invoice().id" },
  template: `
    @let i = invoice();
    <div class="row__main">
      <a
        class="row__name stretched-link"
        [routerLink]="['/cards', i.cardId, 'invoices', i.id]"
        [attr.aria-label]="openLabel()"
        [attr.data-cy]="'invoice-open-' + i.id"
      >
        {{ reference() }}
      </a>
      <app-invoice-status [status]="i.status" />
    </div>
    <span class="row__amount" [attr.data-cy]="'invoice-outstanding-' + i.id">
      <app-money [value]="i.outstanding" />
    </span>
    <p class="row__dates" [attr.data-cy]="'invoice-dates-' + i.id">
      <span>{{ closing() }}</span>
      <span>{{ due() }}</span>
    </p>
    @if (i.hasLateEntries) {
      <p class="row__late" [attr.data-cy]="'invoice-late-' + i.id">
        <strong>{{ t().cards.detail.invoiceRow.lateEntry }}.</strong>
        {{ t().cards.detail.invoiceRow.lateEntryHint }}
      </p>
    }
  `,
  styles: `
    :host(.row) {
      position: relative;
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto;
      grid-template-areas:
        'main amount'
        'dates dates'
        'late late';
      gap: var(--space-1) var(--space-3);
      align-items: center;
      padding: var(--space-4) var(--space-5);
      border-bottom: var(--border-width) solid var(--color-border);
      list-style: none;
    }

    :host(.row:last-child) {
      border-bottom: 0;
    }

    .row__main {
      grid-area: main;
    }

    .row__dates {
      grid-area: dates;
    }

    .row__late {
      grid-area: late;
    }

    .row__main {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: var(--space-2);
    }

    .row__name {
      color: var(--color-text);
      font-weight: var(--weight-semibold);
      text-decoration: none;
    }

    .row__dates {
      display: flex;
      flex-wrap: wrap;
      gap: var(--space-1) var(--space-3);
      color: var(--color-text-muted);
      font-size: var(--text-sm);
    }

    .row__amount {
      grid-area: amount;
      font-size: var(--text-lg);
      font-weight: var(--weight-medium);
      letter-spacing: -0.03em;
      font-variant-numeric: tabular-nums;
    }

    .row__late {
      color: var(--color-warning);
      font-size: var(--text-xs);
    }
  `,
})
export class InvoiceSummaryRowComponent {
  private readonly i18n = inject(I18nService);
  protected readonly t = this.i18n.t;

  readonly invoice = input.required<InvoiceSummary>();

  private readonly locale = computed(() => HTML_LANG[this.i18n.language()]);
  protected readonly reference = computed(() =>
    interpolate(this.t().cards.detail.invoiceRow.reference, {
      month: formatCompetenceShort(this.invoice().referenceMonth, this.locale()),
    }),
  );
  protected readonly openLabel = computed(() =>
    interpolate(this.t().cards.detail.invoiceRow.open, {
      month: formatCompetenceShort(this.invoice().referenceMonth, this.locale()),
    }),
  );
  protected readonly closing = computed(() =>
    interpolate(this.t().cards.detail.invoiceRow.closing, {
      date: formatIsoDate(this.invoice().closingDate, this.locale()),
    }),
  );
  protected readonly due = computed(() =>
    interpolate(this.t().cards.detail.invoiceRow.due, {
      date: formatIsoDate(this.invoice().dueDate, this.locale()),
    }),
  );
}
