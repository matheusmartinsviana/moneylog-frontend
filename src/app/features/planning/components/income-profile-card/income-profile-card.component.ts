import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';

import { MoneyComponent } from '~/app/common/components/money/money.component';
import { HTML_LANG } from '~/app/common/i18n/i18n';
import { I18nService } from '~/app/common/i18n/i18n.service';
import { interpolate } from '~/app/common/i18n/interpolate';
import type { IncomeProfile, PayrollDeduction } from '~/modules/income/core/types/income';
import { formatIsoDate } from '~/util/date';
import { formatMoney } from '~/util/money';
import { formatBps } from '~/util/ratio';

@Component({
  selector: 'li[app-income-profile-card]',
  imports: [MoneyComponent, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'card', '[attr.data-cy]': "'income-profile-' + profile().id" },
  template: `
    @let p = profile();
    <div class="head">
      <div class="head__title">
        <h2 class="name" [attr.data-cy]="'income-profile-source-' + p.id">{{ p.source }}</h2>
        @if (p.status === 'ARCHIVED') {
          <span class="tag" [attr.data-cy]="'income-profile-archived-' + p.id">{{
            t().income.profile.archived
          }}</span>
        }
      </div>
      <p class="gross">
        <span class="note">{{ t().income.profile.gross }}</span>
        <span [attr.data-cy]="'income-profile-gross-' + p.id"><app-money [value]="p.gross" /></span>
      </p>
    </div>

    <ul class="lines">
      <li [attr.data-cy]="'income-profile-dependents-' + p.id">{{ dependentsText() }}</li>
      <li [attr.data-cy]="'income-profile-advance-' + p.id">{{ advanceText() }}</li>
      <li [attr.data-cy]="'income-profile-balance-' + p.id">{{ balanceText() }}</li>
      <li [attr.data-cy]="'income-profile-thirteenth-' + p.id">{{ thirteenthText() }}</li>
    </ul>

    <section class="deductions" [attr.aria-label]="t().income.profile.deductions">
      <h3 class="deductions__title">{{ t().income.profile.deductions }}</h3>
      @if (p.deductions.length === 0) {
        <p class="note" [attr.data-cy]="'income-profile-no-deductions-' + p.id">
          {{ t().income.profile.noDeductions }}
        </p>
      } @else {
        <ul class="deduction-list" [attr.data-cy]="'income-profile-deductions-' + p.id">
          @for (deduction of p.deductions; track $index) {
            <li class="deduction">
              <div class="deduction__main">
                <p class="deduction__title">
                  <span class="tag">{{ t().income.deduction.kind[deduction.kind] }}</span>
                  {{ deduction.label }}
                </p>
                @if (period(deduction); as text) {
                  <p class="note">{{ text }}</p>
                }
                @if (deduction.kind === 'LOAN') {
                  <p class="note">
                    {{ t().income.deduction.loanLinked }}
                    @if (deduction.debtId; as debtId) {
                      ·
                      <a
                        class="link"
                        [routerLink]="['/debts', debtId]"
                        [attr.data-cy]="'income-deduction-debt-' + debtId"
                        >{{ t().income.deduction.openDebt }}</a
                      >
                    }
                  </p>
                  @if (interest(deduction); as text) {
                    <p class="note">{{ text }}</p>
                  }
                }
              </div>
              <p class="deduction__value">
                @if (deduction.amount; as amount) {
                  <app-money [value]="amount" />
                } @else if (deduction.percentBps !== null) {
                  {{ percent(deduction.percentBps) }}
                }
              </p>
            </li>
          }
        </ul>
      }
    </section>

    <div class="actions">
      <button
        type="button"
        class="button"
        [class.button--primary]="!selected()"
        [attr.data-cy]="'income-profile-preview-' + p.id"
        [attr.aria-pressed]="selected()"
        [attr.aria-label]="label(t().income.profile.preview)"
        (click)="previewRequested.emit(p)"
      >
        {{ selected() ? t().income.profile.previewing : t().income.profile.preview }}
      </button>
      @if (p.status === 'ACTIVE') {
        <button
          type="button"
          class="button button--soft"
          [attr.data-cy]="'income-profile-edit-' + p.id"
          [attr.aria-label]="label(t().income.profile.edit)"
          [disabled]="busy()"
          (click)="editRequested.emit(p)"
        >
          {{ t().income.profile.edit }}
        </button>
        <button
          type="button"
          class="button button--soft"
          [attr.data-cy]="'income-profile-archive-' + p.id"
          [attr.aria-label]="label(t().income.profile.archive)"
          [disabled]="busy()"
          (click)="archiveRequested.emit(p)"
        >
          {{ t().income.profile.archive }}
        </button>
      }
    </div>
  `,
  styles: `
    :host(.card) {
      display: grid;
      gap: var(--space-4);
      padding: var(--space-5);
      border: var(--border-width) solid var(--glass-panel-border);
      border-radius: var(--radius-card);
      background-color: var(--card-flat-bg);
      list-style: none;
    }

    .head {
      display: flex;
      flex-wrap: wrap;
      align-items: baseline;
      justify-content: space-between;
      gap: var(--space-1) var(--space-4);
    }

    .head__title {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: var(--space-2);
      min-width: 0;
    }

    .name {
      margin: 0;
      font-size: var(--text-base);
      font-weight: var(--weight-semibold);
      overflow-wrap: anywhere;
    }

    .gross {
      display: flex;
      flex-wrap: wrap;
      align-items: baseline;
      gap: var(--space-2);
      margin: 0;
      font-size: var(--text-xl);
      font-weight: var(--weight-medium);
      letter-spacing: -0.03em;
      font-variant-numeric: tabular-nums;
    }

    .gross .note {
      letter-spacing: 0;
    }

    .note {
      margin: 0;
      color: var(--color-text-muted);
      font-size: var(--text-sm);
    }

    .tag {
      display: inline-block;
      padding: 0 var(--space-2);
      border: var(--border-width) solid var(--color-border);
      border-radius: var(--radius-pill);
      color: var(--color-text-muted);
      font-size: var(--text-xs);
      font-weight: var(--weight-regular);
    }

    .lines,
    .deduction-list {
      display: grid;
      gap: var(--space-1);
      margin: 0;
      padding: 0;
      color: var(--color-text-muted);
      font-size: var(--text-sm);
      list-style: none;
    }

    .deductions {
      display: grid;
      gap: var(--space-2);
    }

    .deductions__title {
      margin: 0;
      font-size: var(--text-sm);
      font-weight: var(--weight-semibold);
    }

    .deduction-list {
      gap: var(--space-3);
      color: inherit;
      font-size: inherit;
    }

    .deduction {
      display: flex;
      flex-wrap: wrap;
      align-items: baseline;
      justify-content: space-between;
      gap: var(--space-1) var(--space-4);
    }

    .deduction__main {
      display: grid;
      gap: var(--space-1);
      min-width: 0;
    }

    .deduction__title {
      margin: 0;
      overflow-wrap: anywhere;
    }

    .deduction__value {
      margin: 0;
      font-weight: var(--weight-semibold);
      font-variant-numeric: tabular-nums;
    }

    .link {
      color: var(--color-accent);
    }

    .actions {
      display: flex;
      flex-wrap: wrap;
      gap: var(--space-2);
    }
  `,
})
export class IncomeProfileCardComponent {
  private readonly i18n = inject(I18nService);
  protected readonly t = this.i18n.t;

  readonly profile = input.required<IncomeProfile>();
  readonly selected = input(false);
  readonly busy = input(false);
  readonly previewRequested = output<IncomeProfile>();
  readonly editRequested = output<IncomeProfile>();
  readonly archiveRequested = output<IncomeProfile>();

  private readonly locale = computed(() => HTML_LANG[this.i18n.language()]);

  protected readonly dependentsText = computed(() =>
    interpolate(this.t().income.profile.dependents, { count: String(this.profile().dependents) }),
  );
  protected readonly advanceText = computed(() => {
    const advance = this.profile().advance;
    return advance === null
      ? this.t().income.profile.noAdvance
      : interpolate(this.t().income.profile.advance, {
          percent: formatBps(advance.percentBps, this.locale()),
          day: String(advance.dayOfMonth),
        });
  });
  protected readonly balanceText = computed(() =>
    interpolate(this.t().income.profile.balance, {
      day: String(this.profile().balanceDayOfMonth),
    }),
  );
  protected readonly thirteenthText = computed(() => {
    const settings = this.profile().thirteenth;
    if (!settings.enabled) return this.t().income.profile.noThirteenth;
    const month = new Intl.DateTimeFormat(this.locale(), { month: 'long', timeZone: 'UTC' }).format(
      new Date(Date.UTC(2000, settings.firstInstallmentMonth - 1, 1)),
    );
    return interpolate(this.t().income.profile.thirteenth, { month });
  });

  protected percent(bps: number): string {
    return interpolate(this.t().income.deduction.percentOfGross, {
      percent: formatBps(bps, this.locale()),
    });
  }

  protected period(deduction: PayrollDeduction): string | null {
    const { startsOn, endsOn } = deduction;
    const date = (value: string) => formatIsoDate(value, this.locale(), 'long');
    if (startsOn !== null && endsOn !== null) {
      return interpolate(this.t().income.deduction.between, {
        from: date(startsOn),
        to: date(endsOn),
      });
    }
    if (startsOn !== null) {
      return interpolate(this.t().income.deduction.since, { date: date(startsOn) });
    }
    if (endsOn !== null) {
      return interpolate(this.t().income.deduction.until, { date: date(endsOn) });
    }
    return null;
  }

  protected interest(deduction: PayrollDeduction): string | null {
    return deduction.interestAmount === null
      ? null
      : interpolate(this.t().income.deduction.interest, {
          amount: formatMoney(deduction.interestAmount),
        });
  }

  protected label(action: string): string {
    return interpolate(this.t().income.profile.actionAria, {
      action,
      name: this.profile().source,
    });
  }
}
