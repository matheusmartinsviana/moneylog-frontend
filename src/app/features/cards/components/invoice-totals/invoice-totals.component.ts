import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';

import { MoneyComponent } from '~/app/common/components/money/money.component';
import { HTML_LANG } from '~/app/common/i18n/i18n';
import { I18nService } from '~/app/common/i18n/i18n.service';
import { InvoiceStatusComponent } from '~/app/features/cards/components/invoice-status/invoice-status.component';
import type { Invoice } from '~/modules/cards/core/types/invoice';
import { formatIsoDate } from '~/util/date';
import type { PersonRef } from '~/util/debt';
import { isPositive } from '~/util/money';

@Component({
  selector: 'app-invoice-totals',
  imports: [MoneyComponent, InvoiceStatusComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let i = invoice();
    @let s = t().cards.invoice.summary;
    @let share = t().cards.invoice.share;
    <div class="totals glass-panel glass-panel--strong glass-panel--card">
      <div class="totals__focus">
        <p class="caption">{{ s.outstanding }}</p>
        <p class="figure" data-cy="invoice-outstanding"><app-money [value]="i.outstanding" /></p>
      </div>
      <dl class="ledger" data-cy="invoice-totals">
        <div class="ledger__row">
          <dt class="ledger__label">{{ s.status }}</dt>
          <dd class="ledger__value"><app-invoice-status [status]="i.status" /></dd>
        </div>
        <div class="ledger__row">
          <dt class="ledger__label">{{ s.closing }}</dt>
          <dd class="ledger__value" data-cy="invoice-closing">{{ closing() }}</dd>
        </div>
        <div class="ledger__row">
          <dt class="ledger__label">{{ s.due }}</dt>
          <dd class="ledger__value" data-cy="invoice-due">{{ due() }}</dd>
        </div>
        <div class="ledger__row">
          <dt class="ledger__label">{{ share.full }}</dt>
          <dd class="ledger__value" data-cy="invoice-total"><app-money [value]="i.total" /></dd>
        </div>
        <div class="ledger__row">
          <dt class="ledger__label">{{ share.mine }}</dt>
          <dd class="ledger__value" data-cy="invoice-my-share">
            <app-money [value]="i.myShare" />
          </dd>
        </div>
        @if (hasThirdParty()) {
          <div class="ledger__row">
            <dt class="ledger__label">{{ share.thirdParty }}</dt>
            <dd class="ledger__value" data-cy="invoice-third-party-share">
              <app-money [value]="i.thirdPartyShare" />
            </dd>
          </div>
          @for (person of byPerson(); track $index) {
            <div class="ledger__row ledger__row--sub" data-cy="invoice-share-person">
              <dt class="ledger__label">{{ person.name }}</dt>
              <dd class="ledger__value"><app-money [value]="person.amount" /></dd>
            </div>
          }
        }
        <div class="ledger__row">
          <dt class="ledger__label">{{ s.carryIn }}</dt>
          <dd class="ledger__value" data-cy="invoice-carry-in">
            <app-money [value]="i.carryIn" />
          </dd>
        </div>
        <div class="ledger__row">
          <dt class="ledger__label">{{ s.paid }}</dt>
          <dd class="ledger__value" data-cy="invoice-paid"><app-money [value]="i.paid" /></dd>
        </div>
        @if (hasCreditCarry()) {
          <div class="ledger__row">
            <dt class="ledger__label">{{ s.creditCarry }}</dt>
            <dd class="ledger__value" data-cy="invoice-credit-carry">
              <app-money [value]="i.creditCarry" />
            </dd>
          </div>
        }
      </dl>
      @if (hasThirdParty()) {
        <p class="share-note" data-cy="invoice-share-note">{{ share.note }}</p>
      }
    </div>
  `,
  styles: `
    :host {
      display: block;
    }

    .totals {
      display: grid;
      gap: var(--space-4);
      padding: var(--space-5);
    }

    .totals__focus {
      display: grid;
      gap: var(--space-1);
    }

    .totals__focus p {
      margin: 0;
    }

    .ledger__row--sub .ledger__label {
      padding-left: var(--space-4);
      font-size: var(--text-sm);
    }

    .share-note {
      margin: var(--space-2) 0 0;
      color: var(--color-text-muted);
      font-size: var(--text-sm);
    }
  `,
})
export class InvoiceTotalsComponent {
  private readonly i18n = inject(I18nService);
  protected readonly t = this.i18n.t;

  readonly invoice = input.required<Invoice>();
  readonly people = input<readonly PersonRef[]>([]);

  protected readonly hasThirdParty = computed(() => isPositive(this.invoice().thirdPartyShare));
  protected readonly byPerson = computed(() =>
    this.invoice()
      .shareByPerson.filter((part) => part.personId !== null)
      .map((part) => ({
        name:
          this.people().find((person) => person.id === part.personId)?.name ??
          this.t().cards.invoice.share.otherPerson,
        amount: part.amount,
      })),
  );

  protected readonly hasCreditCarry = computed(() => isPositive(this.invoice().creditCarry));
  protected readonly closing = computed(() =>
    formatIsoDate(this.invoice().closingDate, HTML_LANG[this.i18n.language()], 'long'),
  );
  protected readonly due = computed(() =>
    formatIsoDate(this.invoice().dueDate, HTML_LANG[this.i18n.language()], 'long'),
  );
}
