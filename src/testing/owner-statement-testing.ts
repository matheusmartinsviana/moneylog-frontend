import { Provider } from '@angular/core';
import { Observable, of } from 'rxjs';

import { OwnerStatementGateway } from '~/modules/owner-statement/core/interfaces/owner-statement.gateway';
import type {
  OwnerStatement,
  OwnerStatementQuery,
  StatementMonth,
} from '~/modules/owner-statement/core/types/owner-statement';

const brl = (amount: string) => ({ amount, currency: 'BRL' });

export function aStatementMonth(overrides: Partial<StatementMonth> = {}): StatementMonth {
  return {
    competence: '2026-11',
    income: {
      total: brl('6000.00'),
      receivedInAccount: brl('6000.00'),
      appliedToDebt: null,
      items: [
        {
          refId: 'occ-1',
          date: '2026-11-16',
          amount: brl('2400.00'),
          status: 'PLANNED',
          estimated: false,
        },
        {
          refId: 'occ-2',
          date: '2026-11-30',
          amount: brl('3600.00'),
          status: 'PLANNED',
          estimated: true,
        },
      ],
    },
    outflow: {
      cardsMine: brl('1500.00'),
      cardsGross: brl('2500.00'),
      subscriptionsMine: brl('100.00'),
      fixed: brl('1200.00'),
      variable: brl('300.00'),
      realEstateMine: brl('1000.00'),
      total: brl('4000.00'),
    },
    companyReimbursable: brl('50.00'),
    surplus: brl('2000.00'),
    endBalance: brl('3000.00'),
    negative: false,
    receivablesPending: brl('700.00'),
    ...overrides,
  };
}

export function aStatement(overrides: Partial<OwnerStatement> = {}): OwnerStatement {
  return {
    asOf: '2026-10-15',
    openingBalance: brl('1000.00'),
    months: [aStatementMonth()],
    negativeMonths: [],
    warnings: [],
    ...overrides,
  };
}

export class OwnerStatementGatewayStub extends OwnerStatementGateway {
  readonly queries: OwnerStatementQuery[] = [];
  result$: Observable<OwnerStatement> = of(aStatement());

  get(query: OwnerStatementQuery): Observable<OwnerStatement> {
    this.queries.push(query);
    return this.result$;
  }
}

export function provideOwnerStatementStub(
  stub: OwnerStatementGatewayStub = new OwnerStatementGatewayStub(),
): Provider[] {
  return [{ provide: OwnerStatementGateway, useValue: stub }];
}
