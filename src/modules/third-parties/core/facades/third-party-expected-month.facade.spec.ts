import { TestBed } from '@angular/core/testing';

import { ThirdPartyExpectedMonthFacade } from '~/modules/third-parties/core/facades/third-party-expected-month.facade';
import type { ThirdPartyExpectedMonth } from '~/modules/third-parties/core/types/third-party';
import { failWith } from '~/testing/accounts-testing';
import { provideThirdPartiesStub, ThirdPartiesGatewayStub } from '~/testing/third-parties-testing';

function setup(stub = new ThirdPartiesGatewayStub()) {
  TestBed.configureTestingModule({
    providers: [provideThirdPartiesStub(stub), ThirdPartyExpectedMonthFacade],
  });
  return { stub, facade: TestBed.inject(ThirdPartyExpectedMonthFacade) };
}

const input = {
  transactionId: 'tx-1',
  installmentId: 'inst-1',
  personId: 'person-1',
  expectedMonth: '2026-12',
};

describe('ThirdPartyExpectedMonthFacade', () => {
  it('Dado um mês escolhido, quando muda, então envia ao gateway e emite o que o servidor devolveu', () => {
    const { stub, facade } = setup();
    const changed: ThirdPartyExpectedMonth[] = [];
    facade.changed$.subscribe((result) => changed.push(result));

    facade.change(input);

    expect(stub.expectedMonthCalls).toEqual([input]);
    expect(changed[0]?.installment).toMatchObject({ expectedMonth: '2026-12', overridden: true });
    expect(facade.savingInstallmentId()).toBeNull();
    expect(facade.problem()).toBeNull();
  });

  it('Dado voltar ao vencimento, quando muda com null, então o gateway recebe null', () => {
    const { stub, facade } = setup();

    facade.change({ ...input, expectedMonth: null });

    expect(stub.expectedMonthCalls[0]?.expectedMonth).toBeNull();
  });

  it('Dado 422 de parcela já recebida, então expõe o código e não emite', () => {
    const stub = new ThirdPartiesGatewayStub();
    stub.expectedMonth$ = failWith(422, 'RECEIVABLE_ALREADY_RECEIVED');
    const { facade } = setup(stub);
    const changed: unknown[] = [];
    facade.changed$.subscribe((result) => changed.push(result));

    facade.change(input);

    expect(facade.problem()?.code).toBe('RECEIVABLE_ALREADY_RECEIVED');
    expect(changed).toEqual([]);
  });
});
