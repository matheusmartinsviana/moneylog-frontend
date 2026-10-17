import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

import { ErrorStateComponent } from '~/app/common/components/error-state/error-state.component';
import { FormModalComponent } from '~/app/common/components/form-modal/form-modal.component';
import { TextFieldComponent } from '~/app/common/components/forms/text-field/text-field.component';
import { MoneyComponent } from '~/app/common/components/money/money.component';
import { HTML_LANG } from '~/app/common/i18n/i18n';
import { I18nService } from '~/app/common/i18n/i18n.service';
import { interpolate } from '~/app/common/i18n/interpolate';
import { problemMessage } from '~/app/common/i18n/problem-message';
import { PurchaseGroupManageFacade } from '~/modules/purchase-groups/core/facades/purchase-group-manage.facade';
import type { PurchaseGroup } from '~/modules/purchase-groups/core/types/purchase-group';
import { PurchaseLinkSearchFacade } from '~/modules/transactions/core/facades/purchase-link-search.facade';
import type { Transaction } from '~/modules/transactions/core/types/transaction';
import { formatIsoDate } from '~/util/date';

@Component({
  selector: 'app-purchase-link-modal',
  imports: [
    ReactiveFormsModule,
    ErrorStateComponent,
    FormModalComponent,
    TextFieldComponent,
    MoneyComponent,
  ],
  providers: [PurchaseLinkSearchFacade],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-form-modal
      #modal
      [heading]="t().purchaseGroups.link.title"
      [busy]="manage.busy()"
      (closed)="closed.emit()"
    >
      <div class="link" data-cy="purchase-link">
        <p class="hint">{{ t().purchaseGroups.link.description }}</p>
        @if (banner(); as message) {
          <p class="banner" role="alert" data-cy="purchase-link-error">{{ message }}</p>
        }
        <app-text-field
          [formControl]="term"
          fieldId="purchase-link-search"
          type="search"
          autocomplete="off"
          [maxlength]="100"
          [label]="t().purchaseGroups.link.search"
        />
        @if (search.searching()) {
          <p class="hint" role="status" data-cy="purchase-link-searching">
            {{ t().purchaseGroups.link.searching }}
          </p>
        } @else if (search.problem(); as problem) {
          <app-error-state [problem]="problem" (retry)="search.retry()" />
        } @else if (search.results(); as results) {
          @if (results.length === 0) {
            <p class="hint" data-cy="purchase-link-none">{{ t().purchaseGroups.link.none }}</p>
          } @else {
            <ul class="results" data-cy="purchase-link-results">
              @for (item of results; track item.id) {
                <li class="result" [attr.data-cy]="'purchase-link-result-' + item.id">
                  <div class="result__main">
                    <p class="result__title">{{ item.description }}</p>
                    <p class="hint">{{ details(item) }}</p>
                  </div>
                  <span class="result__amount"><app-money [value]="item.amount" /></span>
                  <button
                    type="button"
                    class="button"
                    [attr.data-cy]="'purchase-link-choose-' + item.id"
                    [attr.aria-label]="chooseLabel(item)"
                    [disabled]="manage.busy()"
                    (click)="choose(item)"
                  >
                    {{ t().purchaseGroups.link.choose }}
                  </button>
                </li>
              }
            </ul>
          }
        } @else {
          <p class="hint" data-cy="purchase-link-idle">{{ t().purchaseGroups.link.idle }}</p>
        }
        <div class="actions">
          <button
            type="button"
            class="button"
            data-cy="purchase-link-close"
            (click)="modal.requestClose()"
          >
            {{ t().purchaseGroups.link.close }}
          </button>
        </div>
      </div>
    </app-form-modal>
  `,
  styles: `
    :host {
      display: contents;
    }

    .link {
      display: grid;
      gap: var(--space-4);
    }

    .hint {
      margin: 0;
      color: var(--color-text-muted);
      font-size: var(--text-sm);
    }

    .results {
      display: grid;
      gap: var(--space-2);
      margin: 0;
      padding: 0;
      list-style: none;
    }

    .result {
      display: grid;
      gap: var(--space-2);
      padding: var(--space-3);
      border: var(--border-width) solid var(--color-border);
      border-radius: var(--radius-control);
    }

    .result__main {
      display: grid;
      gap: var(--space-1);
      min-width: 0;
    }

    .result__title {
      margin: 0;
      font-weight: var(--weight-medium);
      overflow-wrap: anywhere;
    }

    .result__amount {
      font-weight: var(--weight-semibold);
    }

    .actions {
      display: flex;
      justify-content: flex-end;
    }

    @media (width >= 480px) {
      .result {
        grid-template-columns: minmax(0, 1fr) auto auto;
        align-items: center;
      }
    }
  `,
})
export class PurchaseLinkModalComponent {
  private readonly i18n = inject(I18nService);
  protected readonly t = this.i18n.t;
  protected readonly manage = inject(PurchaseGroupManageFacade);
  protected readonly search = inject(PurchaseLinkSearchFacade);

  readonly group = input.required<PurchaseGroup>();
  readonly closed = output<void>();

  protected readonly term = new FormControl('', { nonNullable: true });
  private readonly locale = computed(() => HTML_LANG[this.i18n.language()]);
  protected readonly banner = computed(() => {
    const problem = this.manage.problem();
    return problem ? problemMessage(problem, this.t().errors) : null;
  });

  constructor() {
    this.term.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe((value) => this.search.search(value));
  }

  protected details(item: Transaction): string {
    const card = item.card?.name ?? '';
    const date = formatIsoDate(item.date, this.locale(), 'long');
    const parts = [card, date].filter((part) => part !== '');
    return parts.join(' · ');
  }

  protected chooseLabel(item: Transaction): string {
    return interpolate(this.t().purchaseGroups.link.chooseAria, { name: item.description });
  }

  protected choose(item: Transaction): void {
    this.manage.link(this.group().id, item.id);
  }
}
