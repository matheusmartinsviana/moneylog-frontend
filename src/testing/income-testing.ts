import { Provider } from '@angular/core';
import { Observable, of } from 'rxjs';

import { IncomeGateway } from '~/modules/income/core/interfaces/income.gateway';
import type {
  GeneratedIncomeOccurrence,
  IncomePreview,
  IncomeProfile,
  IncomeProfileInput,
  IncomeProfileStatus,
  IncomeProfileUpdate,
  TaxTable,
} from '~/modules/income/core/types/income';
import type { Slice } from '~/util/api/slice';

const brl = (amount: string) => ({ amount, currency: 'BRL' });

export function anIncomeProfile(overrides: Partial<IncomeProfile> = {}): IncomeProfile {
  return {
    id: 'inc-1',
    source: 'Empresa A',
    gross: brl('10000.00'),
    dependents: 1,
    advance: { dayOfMonth: 16, percentBps: 4000 },
    balanceDayOfMonth: 1,
    deductions: [],
    thirteenth: { enabled: false, firstInstallmentMonth: 11 },
    status: 'ACTIVE',
    version: 2,
    ...overrides,
  };
}

export function anIncomePreview(overrides: Partial<IncomePreview> = {}): IncomePreview {
  return {
    month: '2026-11',
    gross: brl('10000.00'),
    inss: brl('900.00'),
    irrf: brl('800.00'),
    fixedDeductions: [],
    loanDeductions: [],
    net: brl('8300.00'),
    advance: { date: '2026-11-16', amount: brl('3320.00') },
    balance: { date: '2026-12-01', amount: brl('4980.00') },
    thirteenth: null,
    taxTables: [{ kind: 'INSS', version: 1, effectiveFrom: '2026-01-01' }],
    ...overrides,
  };
}

export function aTaxTable(overrides: Partial<TaxTable> = {}): TaxTable {
  return {
    kind: 'INSS',
    version: 1,
    effectiveFrom: '2026-01-01',
    effectiveTo: null,
    basis: 'COMPETENCE',
    brackets: [{ from: brl('0.00'), upTo: null, rateBps: 750, deduction: brl('0.00') }],
    contributionCeiling: brl('8000.00'),
    sources: [
      {
        agency: 'Agência',
        norm: 'Norma 1/2026',
        url: 'https://example.org',
        consultedOn: '2026-10-01',
      },
    ],
    ...overrides,
  };
}

export class IncomeGatewayStub extends IncomeGateway {
  profiles: IncomeProfile[] = [anIncomeProfile()];
  list$: ((status: IncomeProfileStatus) => Observable<Slice<IncomeProfile>>) | null = null;
  preview$: Observable<IncomePreview> | null = null;
  generate$: Observable<readonly GeneratedIncomeOccurrence[]> | null = null;
  taxTables$: Observable<readonly TaxTable[]> | null = null;
  archive$: Observable<IncomeProfile> | null = null;
  create$: Observable<IncomeProfile> | null = null;
  update$: Observable<IncomeProfile> | null = null;
  readonly listStatuses: IncomeProfileStatus[] = [];
  readonly previews: { id: string; month: string }[] = [];
  readonly generates: { id: string; from: string; to: string }[] = [];
  readonly taxYears: number[] = [];
  readonly archives: string[] = [];
  readonly creates: { input: IncomeProfileInput; key: string }[] = [];
  readonly updates: { id: string; input: IncomeProfileUpdate }[] = [];

  list(status: IncomeProfileStatus): Observable<Slice<IncomeProfile>> {
    this.listStatuses.push(status);
    if (this.list$) return this.list$(status);
    return of({ items: this.profiles.filter((p) => p.status === status), hasNext: false });
  }

  create(input: IncomeProfileInput, idempotencyKey: string): Observable<IncomeProfile> {
    this.creates.push({ input, key: idempotencyKey });
    return this.create$ ?? of(anIncomeProfile({ source: input.source }));
  }

  update(id: string, input: IncomeProfileUpdate): Observable<IncomeProfile> {
    this.updates.push({ id, input });
    return this.update$ ?? of(anIncomeProfile({ id, source: input.source }));
  }

  archive(id: string): Observable<IncomeProfile> {
    this.archives.push(id);
    return this.archive$ ?? of(anIncomeProfile({ id, status: 'ARCHIVED' }));
  }

  preview(id: string, month: string): Observable<IncomePreview> {
    this.previews.push({ id, month });
    return this.preview$ ?? of(anIncomePreview({ month }));
  }

  generate(id: string, from: string, to: string): Observable<readonly GeneratedIncomeOccurrence[]> {
    this.generates.push({ id, from, to });
    return this.generate$ ?? of([]);
  }

  taxTables(year: number): Observable<readonly TaxTable[]> {
    this.taxYears.push(year);
    return this.taxTables$ ?? of([aTaxTable()]);
  }
}

export function provideIncomeStub(stub: IncomeGatewayStub = new IncomeGatewayStub()): Provider[] {
  return [{ provide: IncomeGateway, useValue: stub }];
}
