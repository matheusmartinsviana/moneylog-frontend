import { TestBed } from '@angular/core/testing';
import { Observable, throwError } from 'rxjs';

import { IncomePreviewFacade } from '~/modules/income/core/facades/income-preview.facade';
import { IncomeGateway } from '~/modules/income/core/interfaces/income.gateway';
import { ProblemError } from '~/util/api/problem';

class GatewayStub extends IncomeGateway {
  list = () => throwError(() => new Error('unused'));
  create = () => throwError(() => new Error('unused'));
  update = () => throwError(() => new Error('unused'));
  archive = () => throwError(() => new Error('unused'));
  generate = () => throwError(() => new Error('unused'));
  taxTables = () => throwError(() => new Error('unused'));
  preview(): Observable<never> {
    return throwError(
      () =>
        new ProblemError({
          status: 422,
          code: 'TAX_TABLE_UNAVAILABLE',
          fieldErrors: [],
          traceId: null,
          retryAfterSeconds: null,
        }),
    );
  }
}

describe('IncomePreviewFacade', () => {
  it('Dado 422 TAX_TABLE_UNAVAILABLE, então marca a tabela fiscal como indisponível', () => {
    TestBed.configureTestingModule({
      providers: [{ provide: IncomeGateway, useClass: GatewayStub }, IncomePreviewFacade],
    });
    const facade = TestBed.inject(IncomePreviewFacade);

    facade.load('profile-1', '2026-10');

    expect(facade.state().status).toBe('error');
    expect(facade.taxTableUnavailable()).toBe(true);
  });
});
