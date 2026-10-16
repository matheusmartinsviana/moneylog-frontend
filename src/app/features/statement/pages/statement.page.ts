import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  untracked,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import {
  EmptyStateAction,
  EmptyStateComponent,
} from '~/app/common/components/empty-state/empty-state.component';
import { ErrorStateComponent } from '~/app/common/components/error-state/error-state.component';
import { MonthPickerComponent } from '~/app/common/components/forms/month-picker/month-picker.component';
import { SwitchComponent } from '~/app/common/components/forms/switch/switch.component';
import { MoneyComponent } from '~/app/common/components/money/money.component';
import { PageLayoutComponent } from '~/app/common/components/page-layout/page-layout.component';
import { SectionContainerComponent } from '~/app/common/components/section-container/section-container.component';
import { HTML_LANG } from '~/app/common/i18n/i18n';
import { I18nService } from '~/app/common/i18n/i18n.service';
import { interpolate } from '~/app/common/i18n/interpolate';
import { StatementTableComponent } from '~/app/features/statement/components/statement-table/statement-table.component';
import { OwnerStatementFacade } from '~/modules/owner-statement/core/facades/owner-statement.facade';
import { formatCompetence } from '~/util/date';

const MIN_MONTH = '2000-01';
const MAX_MONTH = '2100-12';
const MONTH = /^\d{4}-(0[1-9]|1[0-2])$/;
const MONTHS_SHOWN = 3;

@Component({
  selector: 'app-statement-page',
  imports: [
    EmptyStateComponent,
    ErrorStateComponent,
    MoneyComponent,
    MonthPickerComponent,
    PageLayoutComponent,
    ReactiveFormsModule,
    RouterLink,
    SectionContainerComponent,
    StatementTableComponent,
    SwitchComponent,
  ],
  providers: [OwnerStatementFacade],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './statement.page.html',
  styleUrl: './statement.page.css',
})
export class StatementPage {
  private readonly i18n = inject(I18nService);
  private readonly router = inject(Router);
  protected readonly facade = inject(OwnerStatementFacade);
  protected readonly t = this.i18n.t;
  protected readonly minMonth = MIN_MONTH;
  protected readonly maxMonth = MAX_MONTH;

  readonly from = input<string>();

  protected readonly picker = new FormControl<string | null>(null);
  protected readonly gross = new FormControl(false, { nonNullable: true });

  private readonly locale = computed(() => HTML_LANG[this.i18n.language()]);
  private readonly validFrom = computed<string | null>(() => {
    const value = this.from();
    return value !== undefined && MONTH.test(value) && value >= MIN_MONTH && value <= MAX_MONTH
      ? value
      : null;
  });

  protected readonly data = this.facade.data;
  protected readonly showGross = toSignal(this.gross.valueChanges, { initialValue: false });

  protected readonly negativeAnnouncement = computed(() => {
    const data = this.data();
    if (!data) return '';
    const copy = this.t().statement;
    if (data.negativeMonths.length === 0) return copy.allPositiveAnnouncement;
    const months = data.negativeMonths
      .map((month) => formatCompetence(month, this.locale()))
      .join(', ');
    return interpolate(copy.negativeAnnouncement, { months });
  });

  protected readonly warnings = computed(() => {
    const data = this.data();
    if (!data) return [];
    const copy = this.t().statement.warnings;
    return data.warnings.map((warning, index) => {
      const month = warning.competence
        ? formatCompetence(warning.competence, this.locale())
        : copy.thisPeriod;
      const template =
        warning.code === 'OPENING_BALANCE_NOT_PROJECTED'
          ? copy.openingBalanceNotProjected
          : warning.code === 'INCOME_MISSING'
            ? copy.incomeMissing
            : warning.code === 'REAL_ESTATE_SHARE_UNDEFINED'
              ? copy.realEstateShareUndefined
              : warning.code === 'TAX_TABLE_UNAVAILABLE'
                ? copy.taxTableUnavailable
                : copy.unknown;
      return {
        key: `${warning.code}-${warning.competence ?? index}`,
        text: interpolate(template, { month }),
        addIncome: warning.code === 'INCOME_MISSING',
      };
    });
  });

  protected readonly receivables = computed(() =>
    (this.data()?.months ?? []).map((month) => ({
      competence: month.competence,
      label: formatCompetence(month.competence, this.locale()),
      pending: month.receivablesPending,
      company: month.companyReimbursable,
    })),
  );

  protected readonly focus = computed(() => {
    const first = this.data()?.months[0];
    if (!first) return null;
    return {
      label: formatCompetence(first.competence, this.locale()),
      surplus: first.surplus,
      endBalance: first.endBalance,
      negative: first.negative,
    };
  });

  protected readonly emptyActions = computed<readonly EmptyStateAction[]>(() => [
    {
      id: 'add-income',
      label: this.t().statement.empty.action,
      available: true,
      primary: true,
      link: '/quick-add',
    },
  ]);

  constructor() {
    effect(() => {
      const from = this.validFrom();
      untracked(() => {
        this.picker.setValue(from, { emitEvent: false });
        this.facade.load({ from, months: MONTHS_SHOWN });
      });
    });
    this.picker.valueChanges.pipe(takeUntilDestroyed()).subscribe((value) => {
      if (value !== null && MONTH.test(value) && value !== this.validFrom()) {
        void this.router.navigate([], { queryParams: { from: value } });
      }
    });
  }

  protected retry(): void {
    this.facade.load({ from: this.validFrom(), months: MONTHS_SHOWN });
  }
}
