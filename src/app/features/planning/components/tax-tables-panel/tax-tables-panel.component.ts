import { ChangeDetectionStrategy, Component, computed, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

import { ErrorStateComponent } from '~/app/common/components/error-state/error-state.component';
import type { ChoiceOption } from '~/app/common/components/forms/choice-option';
import { SelectComponent } from '~/app/common/components/forms/select/select.component';
import { HTML_LANG } from '~/app/common/i18n/i18n';
import { I18nService } from '~/app/common/i18n/i18n.service';
import { interpolate } from '~/app/common/i18n/interpolate';
import { TaxTablesFacade } from '~/modules/income/core/facades/tax-tables.facade';
import type { TaxBracket, TaxTable } from '~/modules/income/core/types/income';
import { formatIsoDate, todayIso } from '~/util/date';
import { formatMoney } from '~/util/money';
import { formatBps } from '~/util/ratio';

const CURRENT_YEAR = Number(todayIso().slice(0, 4));

@Component({
  selector: 'app-tax-tables-panel',
  imports: [ReactiveFormsModule, SelectComponent, ErrorStateComponent],
  providers: [TaxTablesFacade],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="panel surface" aria-labelledby="tax-tables-title" data-cy="tax-tables">
      <h2 class="panel__title" id="tax-tables-title">{{ t().income.taxTables.title }}</h2>
      <p class="note">{{ t().income.taxTables.description }}</p>
      <app-select
        [formControl]="year"
        fieldId="tax-tables-year"
        [options]="yearOptions"
        [label]="t().income.taxTables.year"
      />
      @switch (tables.state().status) {
        @case ('loading') {
          <p class="note" role="status" data-cy="tax-tables-loading">
            {{ t().income.taxTables.loading }}
          </p>
        }
        @case ('error') {
          <app-error-state [problem]="tables.error()" (retry)="load()" />
        }
        @case ('unavailable') {
          <div class="warning" role="alert" data-cy="tax-tables-unavailable">
            <p class="warning__title">{{ t().income.taxTables.unavailableTitle }}</p>
            <p class="note">{{ unavailableText() }}</p>
          </div>
        }
        @case ('ready') {
          <ul class="list" data-cy="tax-tables-list">
            @for (table of tables.data(); track table.kind + table.version + table.effectiveFrom) {
              <li class="table" [attr.data-cy]="'tax-table-' + table.kind + '-' + table.version">
                <p class="table__title">
                  {{ t().income.taxTables.kind[table.kind] }}
                  <span class="tag">{{ versionText(table) }}</span>
                </p>
                <p class="note">{{ effectiveText(table) }}</p>
                <p class="note">{{ t().income.taxTables.basis[table.basis] }}</p>
                @if (table.contributionCeiling; as ceiling) {
                  <p class="note">{{ ceilingText(ceiling) }}</p>
                }
                <ul class="brackets" [attr.aria-label]="t().income.taxTables.brackets">
                  @for (bracket of table.brackets; track $index) {
                    <li class="note">{{ bracketText(bracket) }}</li>
                  }
                </ul>
                @for (source of table.sources; track source.url) {
                  <p class="note">{{ sourceText(source) }}</p>
                }
              </li>
            }
          </ul>
        }
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

    .panel__title {
      margin: 0;
      font-size: var(--text-base);
      font-weight: var(--weight-semibold);
    }

    .note {
      margin: 0;
      color: var(--color-text-muted);
      font-size: var(--text-sm);
      overflow-wrap: anywhere;
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

    .list,
    .brackets {
      display: grid;
      gap: var(--space-4);
      margin: 0;
      padding: 0;
      list-style: none;
    }

    .brackets {
      gap: var(--space-1);
    }

    .table {
      display: grid;
      gap: var(--space-1);
    }

    .table__title {
      margin: 0;
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
  `,
})
export class TaxTablesPanelComponent implements OnInit {
  private readonly i18n = inject(I18nService);
  protected readonly t = this.i18n.t;
  protected readonly tables = inject(TaxTablesFacade);

  protected readonly yearOptions: readonly ChoiceOption[] = [
    CURRENT_YEAR + 1,
    CURRENT_YEAR,
    CURRENT_YEAR - 1,
    CURRENT_YEAR - 2,
  ].map((year) => ({ value: String(year), label: String(year) }));
  protected readonly year = new FormControl<string | null>(String(CURRENT_YEAR));

  private readonly locale = computed(() => HTML_LANG[this.i18n.language()]);

  constructor() {
    this.year.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => this.load());
  }

  ngOnInit(): void {
    this.load();
  }

  protected unavailableText(): string {
    return interpolate(this.t().income.taxTables.unavailableText, { year: this.year.value ?? '' });
  }

  protected load(): void {
    const year = Number(this.year.value);
    if (Number.isInteger(year)) this.tables.load(year);
  }

  protected versionText(table: TaxTable): string {
    return interpolate(this.t().income.taxTables.version, { version: String(table.version) });
  }

  protected effectiveText(table: TaxTable): string {
    const from = formatIsoDate(table.effectiveFrom, this.locale(), 'long');
    return table.effectiveTo === null
      ? interpolate(this.t().income.taxTables.effective, { from })
      : interpolate(this.t().income.taxTables.effectiveBetween, {
          from,
          to: formatIsoDate(table.effectiveTo, this.locale(), 'long'),
        });
  }

  protected ceilingText(ceiling: { amount: string; currency: string }): string {
    return interpolate(this.t().income.taxTables.ceiling, { amount: formatMoney(ceiling) });
  }

  protected bracketText(bracket: TaxBracket): string {
    const rate = formatBps(bracket.rateBps, this.locale());
    return bracket.upTo === null
      ? interpolate(this.t().income.taxTables.bracketOpen, {
          from: formatMoney(bracket.from),
          rate,
        })
      : interpolate(this.t().income.taxTables.bracketLine, {
          from: formatMoney(bracket.from),
          to: formatMoney(bracket.upTo),
          rate,
        });
  }

  protected sourceText(source: { agency: string; norm: string }): string {
    return interpolate(this.t().income.taxTables.source, {
      agency: source.agency,
      norm: source.norm,
    });
  }
}
