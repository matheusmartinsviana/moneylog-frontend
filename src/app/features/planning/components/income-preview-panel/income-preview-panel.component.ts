import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  untracked,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { startWith } from 'rxjs';

import { MonthPickerComponent } from '~/app/common/components/forms/month-picker/month-picker.component';
import { MoneyComponent } from '~/app/common/components/money/money.component';
import { HTML_LANG } from '~/app/common/i18n/i18n';
import { I18nService } from '~/app/common/i18n/i18n.service';
import { interpolate } from '~/app/common/i18n/interpolate';
import { problemMessage } from '~/app/common/i18n/problem-message';
import { IncomeGenerateFacade } from '~/modules/income/core/facades/income-generate.facade';
import { IncomePreviewFacade } from '~/modules/income/core/facades/income-preview.facade';
import {
  isValidGenerateWindow,
  type IncomeProfile,
  type PreviewDeduction,
} from '~/modules/income/core/types/income';
import { formatCompetence, formatIsoDate, shiftCompetence, todayIso } from '~/util/date';
import { formatMoney } from '~/util/money';

const INTEREST_NOT_SPLIT = 'PAYROLL_INTEREST_NOT_SPLIT';

@Component({
  selector: 'app-income-preview-panel',
  imports: [ReactiveFormsModule, RouterLink, MonthPickerComponent, MoneyComponent],
  providers: [IncomePreviewFacade, IncomeGenerateFacade],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="panel surface" aria-labelledby="income-preview-title" data-cy="income-preview">
      <h2 class="panel__title" id="income-preview-title">{{ t().income.preview.title }}</h2>
      @if (profile(); as current) {
        <p class="note">{{ current.source }} · {{ t().income.preview.description }}</p>
        <app-month-picker
          [formControl]="month"
          fieldId="income-preview-month"
          [label]="t().income.preview.month"
        />

        @switch (preview.state().status) {
          @case ('loading') {
            <p class="note" role="status" data-cy="income-preview-loading">
              {{ t().income.preview.loading }}
            </p>
          }
          @case ('error') {
            @if (preview.taxTableUnavailable()) {
              <div class="warning" role="alert" data-cy="income-preview-tax-unavailable">
                <p class="warning__title">{{ t().income.preview.unavailableTitle }}</p>
                <p class="note">{{ t().income.preview.unavailableText }}</p>
              </div>
            } @else {
              <div class="warning" role="alert" data-cy="income-preview-error">
                <p class="note">{{ previewError() }}</p>
                <button
                  type="button"
                  class="button"
                  data-cy="income-preview-retry"
                  (click)="loadPreview()"
                >
                  {{ t().income.taxTables.retry }}
                </button>
              </div>
            }
          }
          @case ('ready') {
            @if (preview.data(); as data) {
              <dl class="facts" data-cy="income-preview-values">
                <div class="fact">
                  <dt>{{ t().income.preview.gross }}</dt>
                  <dd data-cy="income-preview-gross"><app-money [value]="data.gross" /></dd>
                </div>
                <div class="fact">
                  <dt>{{ t().income.preview.inss }}</dt>
                  <dd data-cy="income-preview-inss"><app-money [value]="data.inss" /></dd>
                </div>
                <div class="fact">
                  <dt>{{ t().income.preview.irrf }}</dt>
                  <dd data-cy="income-preview-irrf"><app-money [value]="data.irrf" /></dd>
                </div>
                @if (data.fixedDeductions.length > 0) {
                  <div class="group">
                    <p class="group__title">{{ t().income.preview.fixed }}</p>
                    @for (item of data.fixedDeductions; track $index) {
                      <div class="fact fact--sub">
                        <dt>
                          {{ item.label }}
                          <span class="tag">{{ t().income.deduction.kind[item.kind] }}</span>
                        </dt>
                        <dd><app-money [value]="item.amount" /></dd>
                      </div>
                    }
                  </div>
                }
                @if (data.loanDeductions.length > 0) {
                  <div class="group" data-cy="income-preview-loans">
                    <p class="group__title">{{ t().income.preview.loan }}</p>
                    @for (item of data.loanDeductions; track $index) {
                      <div class="loan">
                        <div class="fact fact--sub">
                          <dt>
                            {{ item.label }}
                            @if (item.confidence === 'ESTIMATED') {
                              <span class="tag" data-cy="income-preview-estimated">{{
                                t().income.preview.estimated
                              }}</span>
                            }
                          </dt>
                          <dd><app-money [value]="item.amount" /></dd>
                        </div>
                        @if (principalText(item); as text) {
                          <p class="note">{{ text }}</p>
                        }
                        @if (interestText(item); as text) {
                          <p class="note">{{ text }}</p>
                        }
                        @if (notSplit(item)) {
                          <p class="note" role="status" data-cy="income-preview-interest-not-split">
                            {{ t().income.deduction.interestNotSplit }}
                          </p>
                        }
                      </div>
                    }
                  </div>
                }
                <div class="fact fact--net">
                  <dt>{{ t().income.preview.net }}</dt>
                  <dd data-cy="income-preview-net"><app-money [value]="data.net" /></dd>
                </div>
              </dl>

              <ul class="payments" data-cy="income-preview-payments">
                @if (data.advance; as advance) {
                  <li class="fact" data-cy="income-preview-advance">
                    <span>{{ paymentLabel('advance', advance.date) }}</span>
                    <span class="value"><app-money [value]="advance.amount" /></span>
                  </li>
                }
                <li class="fact" data-cy="income-preview-balance">
                  <span>{{ paymentLabel('balance', data.balance.date) }}</span>
                  <span class="value"><app-money [value]="data.balance.amount" /></span>
                </li>
                @if (data.thirteenth; as thirteenth) {
                  <li class="fact" data-cy="income-preview-thirteenth">
                    <span>{{ paymentLabel('thirteenth', thirteenth.date) }}</span>
                    <span class="value"><app-money [value]="thirteenth.amount" /></span>
                  </li>
                }
              </ul>
              <p class="note">{{ t().income.preview.note }}</p>

              @if (data.taxTables.length > 0) {
                <div class="tables" data-cy="income-preview-tables">
                  <p class="group__title">{{ t().income.preview.tables }}</p>
                  <ul class="plain">
                    @for (table of data.taxTables; track table.kind) {
                      <li class="note">{{ tableLine(table) }}</li>
                    }
                  </ul>
                </div>
              }
            }
          }
        }

        <div class="generate" data-cy="income-generate">
          <h3 class="group__title">{{ t().income.generate.title }}</h3>
          <p class="note">{{ t().income.generate.description }}</p>
          <div class="pair">
            <app-month-picker
              [formControl]="from"
              fieldId="income-generate-from"
              [label]="t().income.generate.from"
            />
            <app-month-picker
              [formControl]="to"
              fieldId="income-generate-to"
              [label]="t().income.generate.to"
              [hint]="t().income.generate.windowHint"
            />
          </div>
          @if (!windowValid()) {
            <p class="note" role="status" data-cy="income-generate-invalid">
              {{ t().income.generate.invalidWindow }}
            </p>
          }
          @if (generateError(); as message) {
            <p class="banner" role="alert" data-cy="income-generate-error">{{ message }}</p>
          }
          <div class="actions">
            <button
              type="button"
              class="button button--primary"
              data-cy="income-generate-action"
              [disabled]="generate.generating() || !windowValid()"
              [attr.aria-busy]="generate.generating()"
              (click)="runGenerate(current.id)"
            >
              {{
                generate.generating() ? t().income.generate.generating : t().income.generate.action
              }}
            </button>
          </div>
          @if (generate.result(); as items) {
            <div data-cy="income-generate-result">
              <p class="note" role="status" data-cy="income-generate-summary">{{ resultText() }}</p>
              <ul class="plain">
                @for (item of items; track item.recurrenceId) {
                  <li class="fact" [attr.data-cy]="'income-generate-item-' + item.recurrenceId">
                    <span>
                      {{ itemLine(item) }}
                      <span class="tag">{{
                        item.created ? t().income.generate.created : t().income.generate.existing
                      }}</span>
                    </span>
                    <span class="value"><app-money [value]="item.amount" /></span>
                  </li>
                }
              </ul>
              <a
                class="link"
                routerLink="/planning/occurrences"
                data-cy="income-generate-pending"
                >{{ t().income.generate.seePending }}</a
              >
            </div>
          }
        </div>
      } @else {
        <p class="note" data-cy="income-preview-select">{{ t().income.preview.select }}</p>
      }
    </section>
  `,
  styles: `
    :host {
      display: block;
    }

    .panel {
      display: grid;
      gap: var(--space-4);
      padding: var(--space-5);
    }

    .panel__title,
    .group__title {
      margin: 0;
      font-size: var(--text-base);
      font-weight: var(--weight-semibold);
    }

    .group__title {
      font-size: var(--text-sm);
    }

    .note {
      margin: 0;
      color: var(--color-text-muted);
      font-size: var(--text-sm);
    }

    .warning {
      display: grid;
      gap: var(--space-2);
      padding: var(--space-3);
      border: var(--border-width) solid var(--color-warning);
      border-radius: var(--radius-control);
    }

    .warning__title {
      margin: 0;
      font-weight: var(--weight-medium);
    }

    .facts,
    .group,
    .generate,
    .tables {
      display: grid;
      gap: var(--space-3);
      margin: 0;
    }

    .fact {
      display: flex;
      flex-wrap: wrap;
      align-items: baseline;
      justify-content: space-between;
      gap: var(--space-1) var(--space-4);
    }

    .fact dt {
      color: var(--color-text-muted);
      font-size: var(--text-sm);
    }

    .fact dd {
      margin: 0;
      font-weight: var(--weight-semibold);
    }

    .fact--sub dt,
    .fact--sub dd {
      font-size: var(--text-sm);
      font-weight: var(--weight-regular);
    }

    .fact--net {
      padding-top: var(--space-3);
      border-top: var(--border-width) solid var(--color-border);
    }

    .fact--net dt,
    .fact--net dd {
      color: var(--color-text);
      font-size: var(--text-lg);
      font-weight: var(--weight-semibold);
    }

    .loan {
      display: grid;
      gap: var(--space-1);
    }

    .payments,
    .plain {
      display: grid;
      gap: var(--space-2);
      margin: 0;
      padding: 0;
      list-style: none;
    }

    .value {
      font-weight: var(--weight-semibold);
    }

    .tag {
      display: inline-block;
      margin-inline-start: var(--space-1);
      padding: 0 var(--space-2);
      border: var(--border-width) solid var(--color-border);
      border-radius: var(--radius-pill);
      color: var(--color-text-muted);
      font-size: var(--text-xs);
      font-weight: var(--weight-regular);
    }

    .pair {
      display: grid;
      gap: var(--space-4);
    }

    .actions {
      display: flex;
      flex-wrap: wrap;
      gap: var(--space-2);
    }

    .link {
      color: var(--color-accent);
    }

    @media (width >= 480px) {
      .pair {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
    }
  `,
})
export class IncomePreviewPanelComponent {
  private readonly i18n = inject(I18nService);
  protected readonly t = this.i18n.t;
  protected readonly preview = inject(IncomePreviewFacade);
  protected readonly generate = inject(IncomeGenerateFacade);

  readonly profile = input<IncomeProfile | null>(null);

  protected readonly month = new FormControl<string | null>(todayIso().slice(0, 7));
  protected readonly from = new FormControl<string | null>(todayIso().slice(0, 7));
  protected readonly to = new FormControl<string | null>(
    shiftCompetence(todayIso().slice(0, 7), 5),
  );

  private readonly locale = computed(() => HTML_LANG[this.i18n.language()]);
  private readonly monthValue = toSignal(
    this.month.valueChanges.pipe(startWith(this.month.value)),
    {
      initialValue: this.month.value,
    },
  );
  private readonly fromValue = toSignal(this.from.valueChanges.pipe(startWith(this.from.value)), {
    initialValue: this.from.value,
  });
  private readonly toValue = toSignal(this.to.valueChanges.pipe(startWith(this.to.value)), {
    initialValue: this.to.value,
  });

  protected readonly windowValid = computed(() => {
    const from = this.fromValue();
    const to = this.toValue();
    return from !== null && to !== null && isValidGenerateWindow(from, to);
  });
  protected readonly previewError = computed(() => {
    const problem = this.preview.problem();
    return problem ? problemMessage(problem, this.t().errors) : null;
  });
  protected readonly generateError = computed(() => {
    const problem = this.generate.problem();
    return problem ? problemMessage(problem, this.t().errors) : null;
  });
  protected readonly resultText = computed(() =>
    interpolate(this.t().income.generate.result, {
      created: String(this.generate.createdCount()),
      existing: String(this.generate.existingCount()),
    }),
  );

  constructor() {
    effect(() => {
      const profile = this.profile();
      const month = this.monthValue();
      untracked(() => {
        this.generate.reset();
        if (profile !== null && month !== null) this.preview.load(profile.id, month);
        else this.preview.clear();
      });
    });
  }

  protected loadPreview(): void {
    const profile = this.profile();
    const month = this.month.value;
    if (profile !== null && month !== null) this.preview.load(profile.id, month);
  }

  protected runGenerate(profileId: string): void {
    const from = this.from.value;
    const to = this.to.value;
    if (from !== null && to !== null && isValidGenerateWindow(from, to)) {
      this.generate.generate(profileId, from, to);
    }
  }

  protected paymentLabel(kind: 'advance' | 'balance' | 'thirteenth', date: string): string {
    return interpolate(this.t().income.preview[kind], {
      date: formatIsoDate(date, this.locale(), 'long'),
    });
  }

  protected principalText(item: PreviewDeduction): string | null {
    return item.principalAmount === null
      ? null
      : interpolate(this.t().income.preview.principal, {
          amount: formatMoney(item.principalAmount),
        });
  }

  protected interestText(item: PreviewDeduction): string | null {
    return item.interestAmount === null
      ? null
      : interpolate(this.t().income.deduction.interest, {
          amount: formatMoney(item.interestAmount),
        });
  }

  protected notSplit(item: PreviewDeduction): boolean {
    return item.warnings.includes(INTEREST_NOT_SPLIT);
  }

  protected tableLine(table: {
    kind: 'INSS' | 'IRRF';
    version: number;
    effectiveFrom: string;
  }): string {
    return interpolate(this.t().income.preview.tableLine, {
      kind: this.t().income.taxTables.kind[table.kind],
      version: String(table.version),
      date: formatIsoDate(table.effectiveFrom, this.locale(), 'long'),
    });
  }

  protected itemLine(item: {
    kind: 'ADVANCE' | 'BALANCE' | 'THIRTEENTH_FIRST';
    competence: string;
    date: string;
  }): string {
    return interpolate(this.t().income.generate.itemLine, {
      kind: this.t().income.generate.kind[item.kind],
      competence: formatCompetence(item.competence, this.locale()),
      date: formatIsoDate(item.date, this.locale(), 'long'),
    });
  }
}
