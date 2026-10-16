import { TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';

import { CardCashOutFacade } from '~/modules/debts/core/facades/card-cash-out.facade';
import type { CardCashOutInput } from '~/modules/debts/core/types/debt';
import { failWith } from '~/testing/accounts-testing';
import { aDebt, DebtsGatewayStub, provideDebtsStub } from '~/testing/debts-testing';

const INPUT: CardCashOutInput = {
  cardId: 'card-1',
  accountId: 'acc-1',
  beneficiaryPersonId: null,
  principal: '1000.00',
  installments: 4,
  totalWithInterest: '1120.00',
  rateBps: null,
  firstInvoiceDate: '2026-11-05',
  channel: null,
};

function setup(gateway = new DebtsGatewayStub()) {
  TestBed.configureTestingModule({ providers: [provideDebtsStub(gateway), CardCashOutFacade] });
  return { gateway, facade: TestBed.inject(CardCashOutFacade) };
}

describe('CardCashOutFacade', () => {
  it('Dado o salvar, então envia uma Idempotency-Key e emite a dívida da resposta', () => {
    const { facade, gateway } = setup();
    const saved: string[] = [];
    facade.saved$.subscribe((debt) => saved.push(debt.id));

    facade.save(INPUT);

    expect(saved).toEqual(['debt-cash-out']);
    expect(gateway.cashOuts).toEqual([INPUT]);
    expect(gateway.createKeys[0]).toMatch(/^[0-9a-f-]{36}$/);
  });

  it('Dado o clique duplo, então uma requisição só', () => {
    const gateway = new DebtsGatewayStub();
    gateway.next = new Subject<ReturnType<typeof aDebt>>();
    const { facade } = setup(gateway);

    facade.save(INPUT);
    facade.save(INPUT);

    expect(gateway.createKeys).toHaveLength(1);
    expect(facade.saving()).toBe(true);
  });

  it('Dado falha ambígua, então tentar de novo reusa a mesma chave', () => {
    const gateway = new DebtsGatewayStub();
    gateway.next = failWith(503, 'INTERNAL_ERROR');
    const { facade } = setup(gateway);

    facade.save(INPUT);
    expect(facade.canRetry()).toBe(true);
    facade.retry();

    expect(gateway.createKeys).toHaveLength(2);
    expect(gateway.createKeys[1]).toBe(gateway.createKeys[0]);
  });

  it('Dado recusa 422, então guarda o problema e não deixa tentar de novo', () => {
    const gateway = new DebtsGatewayStub();
    gateway.next = failWith(422, 'CARD_CASH_OUT_INVALID');
    const { facade } = setup(gateway);

    facade.save(INPUT);

    expect(facade.problem()?.code).toBe('CARD_CASH_OUT_INVALID');
    expect(facade.canRetry()).toBe(false);
    expect(facade.saving()).toBe(false);
  });
});
