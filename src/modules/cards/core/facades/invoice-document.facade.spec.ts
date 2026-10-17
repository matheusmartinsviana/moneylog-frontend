import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { InvoiceDocumentFacade } from '~/modules/cards/core/facades/invoice-document.facade';
import type { Invoice } from '~/modules/cards/core/types/invoice';
import { brl, failWith } from '~/testing/accounts-testing';
import { anInvoice, CardsGatewayStub, provideCardsStub } from '~/testing/cards-testing';

function setup(gateway = new CardsGatewayStub()) {
  TestBed.configureTestingModule({ providers: [provideCardsStub(gateway), InvoiceDocumentFacade] });
  return { gateway, facade: TestBed.inject(InvoiceDocumentFacade) };
}

describe('InvoiceDocumentFacade', () => {
  it('Dado um valor informado, quando salva, então envia com a versão e emite a fatura devolvida', () => {
    const { gateway, facade } = setup();
    const saved: string[] = [];
    facade.saved$.subscribe((invoice) => saved.push(invoice.documentAmount?.amount ?? 'nulo'));

    facade.save('inv-1', '1300.00', 4);

    expect(gateway.documentAmountCalls).toEqual([
      { invoiceId: 'inv-1', documentAmount: '1300.00', version: 4 },
    ]);
    expect(saved).toEqual(['1300.00']);
    expect(facade.saving()).toBe(false);
    expect(facade.problem()).toBeNull();
  });

  it('Dado limpar o valor, quando salva null, então o gateway recebe null', () => {
    const { gateway, facade } = setup();

    facade.save('inv-1', null, 1);

    expect(gateway.documentAmountCalls[0]?.documentAmount).toBeNull();
  });

  it('Dado a resposta com divergência, então a fatura emitida traz o que a API calculou', () => {
    const gateway = new CardsGatewayStub();
    gateway.documentAmount$ = of(
      anInvoice({ documentAmount: brl('1300.00'), documentDivergence: brl('-17.00') }),
    );
    const { facade } = setup(gateway);
    const saved: Invoice[] = [];
    facade.saved$.subscribe((invoice) => saved.push(invoice));

    facade.save('inv-1', '1300.00', null);

    expect(saved[0]?.documentDivergence).toEqual(brl('-17.00'));
  });

  it('Dado 422 de valor inválido, então expõe o problema e não emite', () => {
    const gateway = new CardsGatewayStub();
    gateway.documentAmount$ = failWith(422, 'INVOICE_DOCUMENT_AMOUNT_INVALID');
    const { facade } = setup(gateway);
    const saved: unknown[] = [];
    facade.saved$.subscribe((invoice) => saved.push(invoice));

    facade.save('inv-1', '-1', null);

    expect(facade.problem()?.code).toBe('INVOICE_DOCUMENT_AMOUNT_INVALID');
    expect(saved).toEqual([]);
  });
});
