import { Component } from '@angular/core';
import { render, screen, waitFor } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { NEVER, of } from 'rxjs';

import { App } from '~/app/app';
import { QuickAddPage } from '~/app/features/quick-add/pages/quick-add.page';
import {
  AccountsGatewayStub,
  anAccount,
  brl,
  failWith,
  provideAccountsStub,
} from '~/testing/accounts-testing';
import { axeViolations, describeViolations } from '~/testing/axe';
import {
  aCard,
  aPurchasePreview,
  CardsGatewayStub,
  provideCardsStub,
} from '~/testing/cards-testing';
import {
  aCategory,
  CategoriesGatewayStub,
  provideCategoriesStub,
} from '~/testing/categories-testing';
import { provideI18nTesting } from '~/testing/i18n-testing';
import { aPerson, PeopleGatewayStub, providePeopleStub } from '~/testing/people-testing';
import { provideTransactionsStub, TransactionsGatewayStub } from '~/testing/transactions-testing';
import { todayIso } from '~/util/date';

vi.setConfig({ testTimeout: 30_000 });

@Component({ selector: 'app-dummy', template: '' })
class DummyComponent {}

const ROXINHO = aCard({ id: 'card-1', name: 'Roxinho' });
const ANA = aPerson({ id: 'person-1', name: 'Ana' });
const BETO = aPerson({ id: 'person-2', name: 'Beto' });

async function setup({
  people = new PeopleGatewayStub(),
  cardsGateway = new CardsGatewayStub(),
  transactions = new TransactionsGatewayStub(),
}: {
  people?: PeopleGatewayStub;
  cardsGateway?: CardsGatewayStub;
  transactions?: TransactionsGatewayStub;
} = {}) {
  if (people.people.length === 0) people.people = [ANA, BETO];
  cardsGateway.cards = [ROXINHO];
  const accounts = new AccountsGatewayStub();
  accounts.accounts = [anAccount({ id: 'acc-nu', name: 'Nubank' })];
  const categories = new CategoriesGatewayStub();
  categories.categories = [aCategory({ id: 'cat-food', name: 'Alimentação' })];
  const result = await render(App, {
    initialRoute: '/quick-add?mode=credit',
    routes: [
      { path: 'quick-add', component: QuickAddPage },
      { path: 'cards/:id/invoices/:invoiceId', component: DummyComponent },
      { path: 'transactions', component: DummyComponent },
    ],
    providers: [
      provideI18nTesting('pt'),
      provideTransactionsStub(transactions),
      provideAccountsStub(accounts),
      provideCategoriesStub(categories),
      provideCardsStub(cardsGateway),
      providePeopleStub(people),
    ],
  });
  await result.fixture.whenStable();
  return { ...result, people, cardsGateway, transactions };
}

const field = (id: string) => screen.getByTestId(id) as HTMLInputElement;
const pick = async (id: string, value: string) => {
  await userEvent.click(screen.getByTestId(id));
  await userEvent.click(await screen.findByTestId(`${id}-option-${value}`));
};

async function fillPurchase() {
  await userEvent.type(field('entry-amount'), '1.200,00');
  await userEvent.type(field('entry-description'), 'Notebook');
  await pick('entry-category', 'cat-food');
}

async function splitWithAna(percent = '50') {
  await userEvent.click(screen.getByTestId('entry-split'));
  await screen.findByTestId('entry-split-field');
  await pick('entry-split-person-0', 'person-1');
  await userEvent.type(field('entry-split-owner-percent'), '50');
  await userEvent.type(field('entry-split-percent-0'), percent);
}

describe('QuickAddPage: compra no cartão com divisão', () => {
  beforeEach(() => localStorage.clear());

  it('Dado a compra sem dividir, então o POST não leva divisão alguma', async () => {
    const { transactions, fixture } = await setup();
    await fillPurchase();

    await userEvent.click(screen.getByTestId('form-save'));
    await fixture.whenStable();

    expect(transactions.creates).toHaveLength(1);
    expect(transactions.creates[0]?.input).not.toHaveProperty('split');
  });

  it('Dado ligar "Dividir", então carrega as pessoas, mostra o campo de divisão e bloqueia o salvar até escolher a pessoa', async () => {
    const { people } = await setup();
    await fillPurchase();

    await userEvent.click(screen.getByTestId('entry-split'));

    expect(await screen.findByTestId('entry-split-field')).toBeInTheDocument();
    expect(people.calls.length + people.queries.length).toBeGreaterThan(0);
    expect(screen.getByTestId('entry-split-problem')).toHaveTextContent(
      'Escolha a pessoa de cada parte.',
    );
    expect(screen.getByTestId('form-save')).toBeDisabled();
  });

  it('Dado 50% para mim e 50% para Ana, então o POST leva split BPS com mim sem pessoa e 5000 pontos-base cada', async () => {
    const { transactions, fixture } = await setup();
    await fillPurchase();

    await splitWithAna();
    await userEvent.click(screen.getByTestId('form-save'));
    await fixture.whenStable();

    expect(transactions.creates).toHaveLength(1);
    expect(transactions.creates[0]?.input).toMatchObject({
      type: 'CARD_PURCHASE',
      split: {
        mode: 'BPS',
        shares: [
          { personId: null, bps: 5000 },
          { personId: 'person-1', bps: 5000 },
        ],
      },
    });
  });

  it('Dado porcentagens que não somam 100, então mostra o problema, bloqueia o salvar e não pede prévia', async () => {
    const { cardsGateway, transactions } = await setup();
    await fillPurchase();

    await splitWithAna('40');

    expect(screen.getByTestId('entry-split-problem')).toHaveTextContent(
      'As porcentagens precisam somar 100%.',
    );
    expect(screen.getByTestId('form-save')).toBeDisabled();
    await new Promise((resolve) => setTimeout(resolve, 500));
    expect(cardsGateway.purchaseRequests.every((r) => r.request.split === null)).toBe(true);
    expect(transactions.creates).toEqual([]);
  });

  it('Dado a divisão válida, então a prévia é pedida ao backend com o split e mostra minha parte e a da pessoa como a resposta', async () => {
    const cardsGateway = new CardsGatewayStub();
    const invoice = {
      id: 'inv-1',
      referenceMonth: '2026-11',
      closingDate: '2026-10-25',
      dueDate: '2026-11-05',
      status: 'OPEN' as const,
    };
    cardsGateway.purchasePreview$ = of(
      aPurchasePreview({
        splitMode: 'BPS',
        installments: [
          {
            number: 1,
            total: 1,
            amount: brl('1200.00'),
            competence: '2026-10',
            invoice,
            lateEntry: false,
            myAmount: brl('600.00'),
            thirdPartyAmount: brl('600.00'),
            byPerson: [{ personId: 'person-1', amount: brl('600.00') }],
          },
        ],
      }),
    );
    await setup({ cardsGateway });
    await fillPurchase();

    await splitWithAna();

    await waitFor(() => expect(screen.getByTestId('purchase-preview-split')).toBeInTheDocument(), {
      timeout: 5000,
    });
    const last = cardsGateway.purchaseRequests.at(-1)!;
    expect(last.request).toMatchObject({
      amount: '1200.00',
      installments: 1,
      date: todayIso(),
      split: {
        mode: 'BPS',
        shares: [
          { personId: null, bps: 5000 },
          { personId: 'person-1', bps: 5000 },
        ],
      },
    });
    const split = screen.getByTestId('purchase-preview-split');
    expect(split).toHaveTextContent('Minha parte');
    expect(split).toHaveTextContent('Ana');
    expect(split.textContent?.replace(/\u00a0/g, ' ')).toContain('R$ 600,00');
  });

  it('Dado desligar "Dividir" depois de preencher, então o POST volta sem divisão', async () => {
    const { transactions, fixture } = await setup();
    await fillPurchase();
    await splitWithAna();

    await userEvent.click(screen.getByTestId('entry-split'));
    await userEvent.click(screen.getByTestId('form-save'));
    await fixture.whenStable();

    expect(transactions.creates).toHaveLength(1);
    expect(transactions.creates[0]?.input).not.toHaveProperty('split');
  });

  it('Dado falha ao carregar as pessoas, então mostra o erro com tentar de novo e recupera', async () => {
    const people = new PeopleGatewayStub();
    people.people = [ANA];
    const failing = failWith(500, 'INTERNAL');
    const original = people.list.bind(people);
    let fail = true;
    people.list = (query) => (fail ? failing : original(query));
    await setup({ people });

    await userEvent.click(screen.getByTestId('entry-split'));

    expect(await screen.findByTestId('entry-split-people-error')).toBeInTheDocument();
    fail = false;
    await userEvent.click(screen.getByTestId('entry-split-people-retry'));
    await waitFor(() =>
      expect(screen.queryByTestId('entry-split-people-error')).not.toBeInTheDocument(),
    );
  });

  it('Dado a mesma pessoa duas vezes, então avisa que cada pessoa só pode aparecer uma vez', async () => {
    await setup();
    await fillPurchase();
    await userEvent.click(screen.getByTestId('entry-split'));
    await screen.findByTestId('entry-split-field');
    await userEvent.click(screen.getByTestId('entry-split-add'));
    await pick('entry-split-person-0', 'person-1');
    await pick('entry-split-person-1', 'person-1');

    expect(screen.getByTestId('entry-split-problem')).toHaveTextContent(
      'Cada pessoa só pode aparecer uma vez.',
    );
    expect(screen.getByTestId('form-save')).toBeDisabled();
  });

  it('Dado o modo "Igualmente" sem eu pagar parte, então o POST leva só a pessoa escolhida sem porcentagens', async () => {
    const { transactions, fixture } = await setup();
    await fillPurchase();

    await userEvent.click(screen.getByTestId('entry-split'));
    await screen.findByTestId('entry-split-field');
    await userEvent.click(screen.getByRole('radio', { name: 'Igualmente' }));
    await pick('entry-split-person-0', 'person-1');
    await userEvent.click(screen.getByTestId('entry-split-include-owner'));
    await userEvent.click(screen.getByTestId('form-save'));
    await fixture.whenStable();

    expect(transactions.creates[0]?.input).toMatchObject({
      split: { mode: 'EQUAL', shares: [{ personId: 'person-1' }] },
    });
  });

  it('Dado envio duplicado com a divisão, então só uma requisição sai', async () => {
    const transactions = new TransactionsGatewayStub();
    transactions.create$ = NEVER;
    await setup({ transactions });
    await fillPurchase();
    await splitWithAna();

    await userEvent.click(screen.getByTestId('form-save'));
    await userEvent.click(screen.getByTestId('form-save'));

    expect(transactions.creates).toHaveLength(1);
  });

  it('Dado a divisão aberta, então não tem violações de acessibilidade', async () => {
    const { container } = await setup();
    await userEvent.click(screen.getByTestId('entry-split'));
    await screen.findByTestId('entry-split-field');

    const violations = await axeViolations(container);
    expect(violations, describeViolations(violations)).toEqual([]);
  });
});
