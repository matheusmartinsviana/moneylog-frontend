import { provideRouter } from '@angular/router';
import { render, screen, waitFor, within } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { NEVER, of } from 'rxjs';

import { PurchasesPage } from '~/app/features/planning/pages/purchases.page';
import { failWith } from '~/testing/accounts-testing';
import { axeViolations, describeViolations } from '~/testing/axe';
import { aCard, CardsGatewayStub, provideCardsStub } from '~/testing/cards-testing';
import { provideI18nTesting } from '~/testing/i18n-testing';
import {
  aPurchaseGroup,
  PurchaseGroupsGatewayStub,
  providePurchaseGroupsStub,
  someCommitments,
} from '~/testing/purchase-groups-testing';
import {
  aTransaction,
  provideTransactionsStub,
  TransactionsGatewayStub,
} from '~/testing/transactions-testing';
import { todayIso } from '~/util/date';

vi.setConfig({ testTimeout: 30_000 });

const brl = (amount: string) => ({ amount, currency: 'BRL' });

const text = (el: HTMLElement) =>
  el.textContent
    ?.replace(/\s+/g, ' ')
    .replace(/\u00a0/g, ' ')
    .trim();

async function setup(
  gateway = new PurchaseGroupsGatewayStub(),
  transactions = new TransactionsGatewayStub(),
  cards = new CardsGatewayStub(),
) {
  const result = await render(PurchasesPage, {
    providers: [
      provideI18nTesting('pt'),
      provideRouter([]),
      providePurchaseGroupsStub(gateway),
      provideTransactionsStub(transactions),
      provideCardsStub(cards),
    ],
  });
  await result.fixture.whenStable();
  result.fixture.detectChanges();
  return { ...result, gateway, transactions, cards };
}

describe('PurchasesPage', () => {
  it('Dado carregando, então mostra o esqueleto das compras e o status do comprometido', async () => {
    const gateway = new PurchaseGroupsGatewayStub();
    gateway.list$ = () => NEVER;
    gateway.commitments$ = NEVER;
    await setup(gateway);

    expect(screen.getByTestId('purchases-loading')).toBeInTheDocument();
    expect(screen.getByTestId('purchases-commitments-loading')).toBeInTheDocument();
  });

  it('Dado o comprometido, então pede 12 meses por padrão e mostra valor cheio e minha parte do servidor', async () => {
    const { gateway } = await setup();

    const [year, month] = todayIso().split('-').map(Number);
    const total = year! * 12 + (month! - 1) + 12;
    const expected = `${Math.floor(total / 12)}-${String((total % 12) + 1).padStart(2, '0')}`;
    expect(gateway.commitmentsUntil[0]).toBe(expected);
    expect(text(screen.getByTestId('purchases-committed'))).toBe('R$ 800,00');
    expect(text(screen.getByTestId('purchases-committed-mine'))).toBe('R$ 650,00');
    expect(screen.getByTestId('purchases-until')).toHaveTextContent('Comprometido até');
  });

  it('Dado o comprometido com meses, então lista cada competência com o valor cheio e minha parte do servidor', async () => {
    await setup();

    const row = screen.getByTestId('purchases-month-2026-11');
    expect(text(row)).toContain('R$ 200,00');
    expect(text(row)).toContain('R$ 150,00');
    expect(screen.getByTestId('purchases-by-month')).toHaveTextContent('2026');
  });

  it('Dado o comprometido sem meses, então não mostra a lista por mês', async () => {
    const gateway = new PurchaseGroupsGatewayStub();
    gateway.commitments$ = of({ ...someCommitments(), byMonth: [] });
    await setup(gateway);

    expect(screen.queryByTestId('purchases-by-month')).not.toBeInTheDocument();
  });

  it('Dado trocar o horizonte para 24 meses, então reconsulta o backend com a nova data', async () => {
    const { gateway, fixture } = await setup();

    await userEvent.click(within(screen.getByTestId('purchases-horizon')).getByText('24 meses'));
    await fixture.whenStable();

    expect(gateway.commitmentsUntil).toHaveLength(2);
    expect(gateway.commitmentsUntil[1]! > gateway.commitmentsUntil[0]!).toBe(true);
  });

  it('Dado falha ao calcular o comprometido, então avisa no bloco e deixa tentar de novo sem derrubar a lista', async () => {
    const gateway = new PurchaseGroupsGatewayStub();
    gateway.commitments$ = failWith(500, 'INTERNAL');
    const { fixture } = await setup(gateway);

    expect(screen.getByTestId('purchases-commitments-error')).toBeInTheDocument();
    expect(screen.getByTestId('purchases-list')).toBeInTheDocument();
    gateway.commitments$ = of(someCommitments());
    await userEvent.click(screen.getByTestId('purchases-commitments-retry'));
    await fixture.whenStable();
    fixture.detectChanges();

    expect(screen.getByTestId('purchases-commitments')).toBeInTheDocument();
  });

  it('Dado um grupo em dois cartões, então mostra total, falta, minha parte e parcela do mês como o servidor devolveu', async () => {
    await setup();

    expect(text(screen.getByTestId('purchase-group-total-group-1'))).toBe('R$ 1.200,00');
    expect(text(screen.getByTestId('purchase-group-remaining-group-1'))).toBe('R$ 800,00');
    expect(text(screen.getByTestId('purchase-group-mine-group-1'))).toBe('R$ 800,00');
    expect(text(screen.getByTestId('purchase-group-per-month-group-1'))).toBe('R$ 200,00');
    expect(screen.getByTestId('purchase-group-end-group-1')).toHaveTextContent('Termina em');
    expect(screen.queryByTestId('purchase-group-interest-group-1')).not.toBeInTheDocument();
  });

  it('Dado grupo com juros, então marca "Com juros"', async () => {
    const gateway = new PurchaseGroupsGatewayStub();
    gateway.groups = [aPurchaseGroup({ interest: true })];
    await setup(gateway);

    expect(screen.getByTestId('purchase-group-interest-group-1')).toHaveTextContent('Com juros');
  });

  it('Dado total informado diferente da soma, então mostra a divergência e diz que vale a soma das compras', async () => {
    const gateway = new PurchaseGroupsGatewayStub();
    gateway.groups = [
      aPurchaseGroup({
        divergence: {
          declared: brl('1300.00'),
          computed: brl('1200.00'),
          difference: brl('100.00'),
        },
      }),
    ];
    await setup(gateway);

    const box = screen.getByTestId('purchase-group-divergence-group-1');
    expect(text(box)).toContain('R$ 1.300,00');
    expect(text(box)).toContain('R$ 1.200,00');
    expect(text(box)).toContain('R$ 100,00');
    expect(text(box)).toContain('O total do grupo é sempre a soma das compras.');
  });

  it('Dado o grupo, quando abro as compras, então lista cada cartão sem somar o valor duas vezes', async () => {
    await setup();

    await userEvent.click(screen.getByTestId('purchase-group-toggle-group-1'));

    expect(text(screen.getByTestId('purchase-member-tx-a'))).toContain('Cartão A');
    expect(text(screen.getByTestId('purchase-member-tx-b'))).toContain('Cartão B');
    expect(text(screen.getByTestId('purchase-member-tx-a'))).toContain('4 de 6 parcelas a vencer');
    expect(text(screen.getByTestId('purchase-group-total-group-1'))).toBe('R$ 1.200,00');
  });

  it('Dado desvincular uma compra, então chama o backend, avisa e recarrega a lista e o comprometido', async () => {
    const { gateway, fixture } = await setup();

    await userEvent.click(screen.getByTestId('purchase-group-toggle-group-1'));
    await userEvent.click(screen.getByTestId('purchase-member-unlink-tx-a'));
    await fixture.whenStable();

    expect(gateway.removed).toEqual([{ id: 'group-1', transactionId: 'tx-a' }]);
    expect(gateway.listStatuses.length).toBeGreaterThanOrEqual(2);
    expect(gateway.commitmentsUntil.length).toBeGreaterThanOrEqual(2);
  });

  it('Dado falha ao desvincular, então mostra o erro e não recarrega', async () => {
    const gateway = new PurchaseGroupsGatewayStub();
    gateway.removeMember$ = failWith(422, 'PURCHASE_GROUP_INVALID');
    await setup(gateway);

    await userEvent.click(screen.getByTestId('purchase-group-toggle-group-1'));
    await userEvent.click(screen.getByTestId('purchase-member-unlink-tx-a'));

    expect(await screen.findByTestId('purchases-action-error')).toBeInTheDocument();
    expect(gateway.listStatuses).toHaveLength(1);
  });

  it('Dado nenhum grupo em andamento, então mostra o estado vazio com a ação de criar', async () => {
    const gateway = new PurchaseGroupsGatewayStub();
    gateway.groups = [];
    await setup(gateway);

    expect(screen.getByText('Nenhuma compra agrupada ainda')).toBeInTheDocument();
    await userEvent.click(screen.getByTestId('empty-state-action-add'));
    expect(await screen.findByRole('dialog')).toHaveAccessibleName('Nova compra agrupada');
  });

  it('Dado o filtro Quitadas, então consulta o backend por DONE e marca o grupo como quitado', async () => {
    const gateway = new PurchaseGroupsGatewayStub();
    gateway.groups = [aPurchaseGroup({ status: 'DONE', remaining: brl('0.00') })];
    const { fixture } = await setup(gateway);

    await userEvent.click(within(screen.getByTestId('purchases-status')).getByText('Quitadas'));
    await fixture.whenStable();
    fixture.detectChanges();

    expect(gateway.listStatuses.at(-1)).toBe('DONE');
    expect(screen.getByTestId('purchase-group-done-group-1')).toBeInTheDocument();
  });

  it('Dado falha ao listar, quando tento de novo, então mostra os grupos', async () => {
    const gateway = new PurchaseGroupsGatewayStub();
    gateway.list$ = () => failWith(500, 'INTERNAL');
    const { fixture } = await setup(gateway);

    expect(screen.getByTestId('error-state')).toBeInTheDocument();
    gateway.list$ = null;
    await userEvent.click(screen.getByTestId('empty-state-action-retry'));
    await fixture.whenStable();
    fixture.detectChanges();

    expect(screen.getByTestId('purchases-list')).toBeInTheDocument();
  });

  it('Dado editar o grupo, então só permite mudar nome e juros e envia a version', async () => {
    const { gateway, fixture } = await setup();

    await userEvent.click(screen.getByTestId('purchase-group-edit-group-1'));
    expect(await screen.findByTestId('purchase-form')).toBeInTheDocument();
    expect(screen.queryByTestId('purchase-form-members')).not.toBeInTheDocument();
    await userEvent.clear(screen.getByTestId('purchase-form-name'));
    await userEvent.type(screen.getByTestId('purchase-form-name'), 'Sofá novo');
    await userEvent.click(screen.getByTestId('purchase-form-save'));
    await fixture.whenStable();

    expect(gateway.updates).toEqual([
      { id: 'group-1', input: { name: 'Sofá novo', interest: false, version: 1 } },
    ]);
  });

  it('Dado criar sem preencher, então mostra os erros e não chama o backend', async () => {
    const cards = new CardsGatewayStub();
    cards.cards = [aCard({ id: 'card-a', name: 'Cartão A' })];
    const { gateway } = await setup(new PurchaseGroupsGatewayStub(), undefined, cards);

    await userEvent.click(screen.getByTestId('purchases-add'));
    await screen.findByTestId('purchase-form');
    await userEvent.click(screen.getByTestId('purchase-form-save'));

    expect(gateway.creates).toEqual([]);
    expect(screen.getByTestId('purchase-form')).toBeInTheDocument();
  });

  it('Dado nenhum cartão cadastrado, então o formulário pede para cadastrar um cartão', async () => {
    const cards = new CardsGatewayStub();
    cards.cards = [];
    await setup(new PurchaseGroupsGatewayStub(), undefined, cards);

    await userEvent.click(screen.getByTestId('purchases-add'));

    expect(await screen.findByTestId('purchase-form-no-cards')).toBeInTheDocument();
    expect(screen.getByTestId('purchase-form-add-card')).toHaveAttribute('href', '/cards/new');
  });

  it('Dado criar com um cartão, quando preencho tudo, então envia nome, parcelas e data com chave de idempotência', async () => {
    const cards = new CardsGatewayStub();
    cards.cards = [aCard({ id: 'card-a', name: 'Cartão A' })];
    const { gateway, fixture } = await setup(new PurchaseGroupsGatewayStub(), undefined, cards);

    await userEvent.click(screen.getByTestId('purchases-add'));
    await screen.findByTestId('purchase-form');
    await userEvent.type(screen.getByTestId('purchase-form-name'), 'Geladeira');
    await userEvent.click(screen.getByTestId('purchase-form-card-0'));
    await userEvent.click(await screen.findByRole('option', { name: 'Cartão A' }));
    await userEvent.type(screen.getByTestId('purchase-form-amount-0'), '150,00');
    await userEvent.type(screen.getByTestId('purchase-form-total-0'), '6');
    await userEvent.type(screen.getByTestId('purchase-form-first-invoice-0'), '15/11/2026');
    await userEvent.click(screen.getByTestId('purchase-form-save'));
    await fixture.whenStable();

    await waitFor(() => expect(gateway.creates).toHaveLength(1));
    expect(gateway.creates[0]!.input).toMatchObject({
      name: 'Geladeira',
      interest: false,
      declaredTotal: null,
      members: [
        {
          cardId: 'card-a',
          totalInstallments: 6,
          installmentAmount: '150.00',
          firstInvoiceDate: '2026-11-15',
        },
      ],
    });
    expect(gateway.creates[0]!.key).toBeTruthy();
  });

  it('Dado vincular compra, então busca compras parceladas e vincula a escolhida', async () => {
    const transactions = new TransactionsGatewayStub();
    transactions.list$ = () =>
      of({
        items: [
          aTransaction({
            id: 'tx-new',
            description: 'Mesa',
            type: 'CARD_PURCHASE',
            installments: [
              {
                number: 1,
                total: 3,
                amount: brl('100.00'),
                dueDate: '2026-11-05',
                invoiceId: null,
                status: 'OPEN',
              },
              {
                number: 2,
                total: 3,
                amount: brl('100.00'),
                dueDate: '2026-12-05',
                invoiceId: null,
                status: 'OPEN',
              },
            ] as never,
          }),
        ],
        hasNext: false,
        totals: { count: 1 } as never,
      });
    const { gateway, fixture } = await setup(new PurchaseGroupsGatewayStub(), transactions);

    await userEvent.click(screen.getByTestId('purchase-group-link-group-1'));
    await userEvent.type(await screen.findByTestId('purchase-link-search'), 'Mesa');
    const choose = await screen.findByTestId('purchase-link-choose-tx-new', undefined, {
      timeout: 5000,
    });
    await userEvent.click(choose);
    await fixture.whenStable();

    expect(gateway.added).toEqual([{ id: 'group-1', transactionId: 'tx-new' }]);
  });

  it('Dado falha na busca de compras para vincular, então não diz "Nenhuma compra encontrada" como se a busca tivesse funcionado', async () => {
    const transactions = new TransactionsGatewayStub();
    transactions.list$ = () => failWith(500, 'INTERNAL');
    await setup(new PurchaseGroupsGatewayStub(), transactions);

    await userEvent.click(screen.getByTestId('purchase-group-link-group-1'));
    await userEvent.type(await screen.findByTestId('purchase-link-search'), 'Mesa');

    await screen.findByTestId('error-state', undefined, { timeout: 5000 });
    expect(screen.queryByTestId('purchase-link-none')).not.toBeInTheDocument();
  });

  it('Dado a tela pronta, então não tem violações de acessibilidade', async () => {
    const { container } = await setup();

    const violations = await axeViolations(container);
    expect(violations, describeViolations(violations)).toEqual([]);
  });
});
