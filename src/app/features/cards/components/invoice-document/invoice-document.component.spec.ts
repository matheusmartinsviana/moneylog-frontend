import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { of } from 'rxjs';

import { InvoiceDocumentComponent } from '~/app/features/cards/components/invoice-document/invoice-document.component';
import { brl, failWith } from '~/testing/accounts-testing';
import { anInvoice, CardsGatewayStub, provideCardsStub } from '~/testing/cards-testing';
import { provideI18nTesting } from '~/testing/i18n-testing';

vi.setConfig({ testTimeout: 20_000 });

async function setup(invoice = anInvoice(), gateway = new CardsGatewayStub()) {
  const saved: unknown[] = [];
  const conflicts: unknown[] = [];
  const result = await render(InvoiceDocumentComponent, {
    inputs: { invoice },
    on: { saved: (value: unknown) => saved.push(value), conflict: () => conflicts.push(true) },
    providers: [provideI18nTesting('pt'), provideCardsStub(gateway)],
  });
  return { ...result, gateway, saved, conflicts };
}

const field = () => screen.getByTestId('invoice-document-amount') as HTMLInputElement;

describe('InvoiceDocumentComponent', () => {
  it('Dado fatura sem valor no documento, então mostra o campo vazio, sem diferença e sem limpar', async () => {
    await setup();

    expect(field().value).toBe('');
    expect(screen.queryByTestId('invoice-document-divergence')).toBeNull();
    expect(screen.queryByTestId('invoice-document-clear')).toBeNull();
  });

  it('Dado o valor digitado, quando salva, então envia com a versão e avisa a página com a fatura devolvida', async () => {
    const { gateway, saved } = await setup(anInvoice({ documentVersion: 3 }));

    await userEvent.type(field(), '1300,00');
    await userEvent.click(screen.getByTestId('invoice-document-save'));

    expect(gateway.documentAmountCalls).toEqual([
      { invoiceId: 'inv-1', documentAmount: '1300.00', version: 3 },
    ]);
    expect(saved).toHaveLength(1);
  });

  it('Dado divergência da API, então mostra a diferença como veio, em tom de aviso e com limpar', async () => {
    await setup(
      anInvoice({
        documentAmount: brl('1300.00'),
        documentDivergence: brl('-17.00'),
      }),
    );

    expect(field().value).toBe('1.300,00');
    expect(screen.getByTestId('invoice-document-divergence')).toHaveTextContent(
      /Diferença de .*17,00 entre o total e o documento/,
    );
    expect(screen.getByTestId('invoice-document-clear')).toBeInTheDocument();
  });

  it('Dado valor informado, quando limpa, então envia null', async () => {
    const { gateway } = await setup(anInvoice({ documentAmount: brl('1300.00') }));

    await userEvent.click(screen.getByTestId('invoice-document-clear'));

    expect(gateway.documentAmountCalls[0]).toMatchObject({ documentAmount: null });
  });

  it('Dado 422 de valor inválido, então mostra a mensagem do código e não avisa a página', async () => {
    const gateway = new CardsGatewayStub();
    gateway.documentAmount$ = failWith(422, 'INVOICE_DOCUMENT_AMOUNT_INVALID');
    const { saved } = await setup(anInvoice(), gateway);

    await userEvent.type(field(), '10,00');
    await userEvent.click(screen.getByTestId('invoice-document-save'));

    expect(await screen.findByTestId('invoice-document-error')).toHaveTextContent(
      'Informe um valor igual ou maior que zero.',
    );
    expect(saved).toEqual([]);
  });

  it('Dado 409 de versão, então pede à página recarregar a fatura', async () => {
    const gateway = new CardsGatewayStub();
    gateway.documentAmount$ = failWith(409, 'VERSION_CONFLICT');
    const { conflicts } = await setup(anInvoice(), gateway);

    await userEvent.type(field(), '10,00');
    await userEvent.click(screen.getByTestId('invoice-document-save'));

    await screen.findByTestId('invoice-document-error');
    expect(conflicts).toHaveLength(1);
  });

  it('Dado resposta com sucesso, então não sobra erro na tela', async () => {
    const gateway = new CardsGatewayStub();
    gateway.documentAmount$ = of(anInvoice({ documentAmount: brl('10.00') }));
    await setup(anInvoice(), gateway);

    await userEvent.type(field(), '10,00');
    await userEvent.click(screen.getByTestId('invoice-document-save'));

    expect(screen.queryByTestId('invoice-document-error')).toBeNull();
  });
});
