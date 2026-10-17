import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { TransactionDetailFacade } from '~/modules/transactions/core/facades/transaction-detail.facade';
import { TransactionsEvents } from '~/modules/transactions/core/facades/transactions-events';
import { brl, failWith } from '~/testing/accounts-testing';
import {
  aTransaction,
  provideTransactionsStub,
  TransactionsGatewayStub,
} from '~/testing/transactions-testing';
import type { SplitInput } from '~/util/split';

const SPLIT: SplitInput = {
  mode: 'BPS',
  shares: [
    { personId: null, bps: 7000 },
    { personId: 'person-1', bps: 3000 },
  ],
};

function setup(gateway = new TransactionsGatewayStub()) {
  TestBed.configureTestingModule({
    providers: [provideTransactionsStub(gateway), TransactionDetailFacade],
  });
  return {
    gateway,
    facade: TestBed.inject(TransactionDetailFacade),
    events: TestBed.inject(TransactionsEvents),
  };
}

describe('TransactionDetailFacade, edição do rateio', () => {
  it('Dado novo rateio, então envia modo, partes e versão, usa a resposta do backend e avisa a lista', () => {
    const gateway = new TransactionsGatewayStub();
    const updated = aTransaction({
      type: 'CARD_PURCHASE',
      version: 4,
      splitMode: 'BPS',
      myAmount: brl('70.00'),
      thirdPartyAmount: brl('30.00'),
    });
    gateway.shares$ = of(updated);
    const { facade, events } = setup(gateway);
    const changes = vi.fn();
    events.changes$.subscribe(changes);
    facade.load('tx-1');

    facade.updateShares('tx-1', SPLIT, 3);

    expect(gateway.shareUpdates).toEqual([{ id: 'tx-1', split: SPLIT, version: 3 }]);
    expect(facade.transaction()).toEqual(updated);
    expect(facade.sharesProblem()).toBeNull();
    expect(changes).toHaveBeenCalledTimes(1);
  });

  it('Dado SHARES_BELOW_RECEIVED, então expõe o problema e mantém a compra como estava', () => {
    const gateway = new TransactionsGatewayStub();
    gateway.shares$ = failWith(422, 'SHARES_BELOW_RECEIVED');
    const { facade } = setup(gateway);
    facade.load('tx-1');

    facade.updateShares('tx-1', SPLIT, 1);

    expect(facade.sharesProblem()?.code).toBe('SHARES_BELOW_RECEIVED');
    expect(facade.sharesSaving()).toBe(false);
    expect(facade.transaction()).toEqual(aTransaction());
  });
});
