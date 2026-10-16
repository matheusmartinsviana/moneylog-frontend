import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { render, screen, waitFor } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { NEVER, of } from 'rxjs';

import { App } from '~/app/app';
import { ToastService } from '~/app/common/services/toast.service';
import { TransactionDetailPage } from '~/app/features/transactions/pages/transaction-detail.page';
import { TransactionsPage } from '~/app/features/transactions/pages/transactions.page';
import type { Transaction } from '~/modules/transactions/core/types/transaction';
import {
  AccountsGatewayStub,
  anAccount,
  brl,
  failWith,
  provideAccountsStub,
} from '~/testing/accounts-testing';
import { axeViolations, describeViolations } from '~/testing/axe';
import { CategoriesGatewayStub, provideCategoriesStub } from '~/testing/categories-testing';
import { provideI18nTesting } from '~/testing/i18n-testing';
import { provideNotesStub } from '~/testing/notes-testing';
import { aPerson, PeopleGatewayStub, providePeopleStub } from '~/testing/people-testing';
import { provideThirdPartiesStub } from '~/testing/third-parties-testing';
import {
  aTransaction,
  provideTransactionsStub,
  TransactionsGatewayStub,
} from '~/testing/transactions-testing';

vi.setConfig({ testTimeout: 30_000 });

@Component({ selector: 'app-dummy', template: '' })
class DummyComponent {}

const text = (el: HTMLElement) =>
  el.textContent
    ?.replace(/\s+/g, ' ')
    .replace(/\u00a0/g, ' ')
    .trim();

const plainPurchase = (overrides: Partial<Transaction> = {}) =>
  aTransaction({
    id: 'tx-card',
    type: 'CARD_PURCHASE',
    description: 'Notebook',
    amount: brl('1200.00'),
    account: null,
    method: null,
    card: { id: 'card-1', name: 'Roxinho' },
    ...overrides,
  });

const splitPurchase = (overrides: Partial<Transaction> = {}) =>
  plainPurchase({
    splitMode: 'BPS',
    personShares: [
      { personId: null, bps: 5000, amount: brl('600.00') },
      { personId: 'person-1', bps: 5000, amount: brl('600.00') },
    ],
    myAmount: brl('600.00'),
    thirdPartyAmount: brl('600.00'),
    version: 4,
    ...overrides,
  });

async function setup(tx: Transaction, gateway = new TransactionsGatewayStub()) {
  gateway.get$ = of(tx);
  const accounts = new AccountsGatewayStub();
  accounts.accounts = [anAccount()];
  const people = new PeopleGatewayStub();
  people.people = [
    aPerson({ id: 'person-1', name: 'Ana' }),
    aPerson({ id: 'person-2', name: 'Beto' }),
  ];
  const result = await render(App, {
    initialRoute: `/transactions/${tx.id}`,
    providers: [
      provideRouter(
        [
          {
            path: 'transactions',
            component: TransactionsPage,
            children: [{ path: ':id', component: TransactionDetailPage }],
          },
          { path: 'cards/:id/invoices/:invoiceId', component: DummyComponent },
        ],
        withComponentInputBinding(),
      ),
      provideI18nTesting('pt'),
      provideNotesStub(),
      provideThirdPartiesStub(),
      provideTransactionsStub(gateway),
      provideAccountsStub(accounts),
      provideCategoriesStub(new CategoriesGatewayStub()),
      providePeopleStub(people),
    ],
  });
  await result.fixture.whenStable();
  return { gateway, ...result, toast: TestBed.inject(ToastService) };
}

describe('TransactionDetailPage: divisão da compra no cartão', () => {
  it('Dado compra toda minha, então diz que é toda sua, oferece editar e não oferece registrar recebimento', async () => {
    await setup(plainPurchase());

    expect(screen.getByTestId('detail-split-none')).toHaveTextContent('Esta compra é toda sua.');
    expect(screen.getByTestId('detail-split-edit')).toBeInTheDocument();
    expect(screen.queryByTestId('detail-split-receive')).not.toBeInTheDocument();
  });

  it('Dado compra dividida, então mostra minha parte, a de outros e cada linha com o nome e a porcentagem do servidor', async () => {
    await setup(splitPurchase());

    expect(text(screen.getByTestId('detail-split-mine'))).toBe('R$ 600,00');
    expect(text(screen.getByTestId('detail-split-third'))).toBe('R$ 600,00');
    const lines = text(screen.getByTestId('detail-split-lines'))!;
    expect(lines).toContain('Eu');
    expect(lines).toContain('Ana');
    expect(lines).toContain('50%');
    expect(screen.getByTestId('detail-split-receive')).toBeInTheDocument();
  });

  it('Dado divisão igual, então mostra "Dividido igualmente" nas linhas sem porcentagem', async () => {
    await setup(
      splitPurchase({
        splitMode: 'EQUAL',
        personShares: [
          { personId: null, bps: null, amount: null },
          { personId: 'person-1', bps: null, amount: null },
        ],
      }),
    );

    expect(text(screen.getByTestId('detail-split-lines'))).toContain('Dividido igualmente');
  });

  it('Dado uma despesa comum, então não mostra a seção de divisão', async () => {
    await setup(aTransaction({ id: 'tx-exp', type: 'EXPENSE' }));

    expect(screen.queryByTestId('detail-split')).not.toBeInTheDocument();
  });

  it('Dado compra anulada, então não mostra a seção de divisão', async () => {
    await setup(splitPurchase({ status: 'VOIDED' }));

    expect(screen.queryByTestId('detail-split')).not.toBeInTheDocument();
  });

  it('Dado editar a divisão, então abre com os valores atuais e avisa que vale também em fatura fechada', async () => {
    await setup(splitPurchase());

    await userEvent.click(screen.getByTestId('detail-split-edit'));

    expect(await screen.findByTestId('split-edit-form')).toBeInTheDocument();
    expect(screen.getByTestId('split-edit-closed-note')).toHaveTextContent(
      'Vale também em fatura fechada.',
    );
    expect(screen.getByTestId('split-edit-owner-percent')).toHaveValue('50');
    expect(screen.getByTestId('split-edit-percent-0')).toHaveValue('50');
  });

  it('Dado 70% para mim e 30% para Ana, então envia a divisão com a version da compra e avisa', async () => {
    const { gateway, toast, fixture } = await setup(splitPurchase());

    await userEvent.click(screen.getByTestId('detail-split-edit'));
    await screen.findByTestId('split-edit-form');
    await userEvent.clear(screen.getByTestId('split-edit-owner-percent'));
    await userEvent.type(screen.getByTestId('split-edit-owner-percent'), '70');
    await userEvent.clear(screen.getByTestId('split-edit-percent-0'));
    await userEvent.type(screen.getByTestId('split-edit-percent-0'), '30');
    await userEvent.click(screen.getByTestId('split-edit-save'));
    await fixture.whenStable();

    expect(gateway.shareUpdates).toEqual([
      {
        id: 'tx-card',
        split: {
          mode: 'BPS',
          shares: [
            { personId: null, bps: 7000 },
            { personId: 'person-1', bps: 3000 },
          ],
        },
        version: 4,
      },
    ]);
    expect(toast.toasts()[0]?.message).toBe('Divisão atualizada.');
    await waitFor(() => expect(screen.queryByTestId('split-edit-form')).not.toBeInTheDocument());
  });

  it('Dado porcentagens que não fecham 100, então desabilita o salvar e não envia', async () => {
    const { gateway } = await setup(splitPurchase());

    await userEvent.click(screen.getByTestId('detail-split-edit'));
    await screen.findByTestId('split-edit-form');
    await userEvent.clear(screen.getByTestId('split-edit-percent-0'));
    await userEvent.type(screen.getByTestId('split-edit-percent-0'), '30');

    expect(screen.getByTestId('split-edit-problem')).toHaveTextContent(
      'As porcentagens precisam somar 100%.',
    );
    expect(screen.getByTestId('split-edit-save')).toBeDisabled();
    expect(gateway.shareUpdates).toEqual([]);
  });

  it('Dado SHARES_BELOW_RECEIVED, então mostra o motivo no modal, mantém aberto e mantém a divisão antiga na tela', async () => {
    const gateway = new TransactionsGatewayStub();
    gateway.shares$ = failWith(422, 'SHARES_BELOW_RECEIVED');
    await setup(splitPurchase(), gateway);

    await userEvent.click(screen.getByTestId('detail-split-edit'));
    await screen.findByTestId('split-edit-form');
    await userEvent.clear(screen.getByTestId('split-edit-owner-percent'));
    await userEvent.type(screen.getByTestId('split-edit-owner-percent'), '90');
    await userEvent.clear(screen.getByTestId('split-edit-percent-0'));
    await userEvent.type(screen.getByTestId('split-edit-percent-0'), '10');
    await userEvent.click(screen.getByTestId('split-edit-save'));

    expect(await screen.findByTestId('split-edit-error')).toHaveTextContent(
      'Uma pessoa já pagou mais do que a nova parte dela.',
    );
    expect(screen.getByTestId('split-edit-form')).toBeInTheDocument();
    expect(text(screen.getByTestId('detail-split-mine'))).toBe('R$ 600,00');
  });

  it('Dado conflito de versão ao salvar a divisão, então mostra o erro no modal', async () => {
    const gateway = new TransactionsGatewayStub();
    gateway.shares$ = failWith(409, 'VERSION_CONFLICT');
    await setup(splitPurchase(), gateway);

    await userEvent.click(screen.getByTestId('detail-split-edit'));
    await screen.findByTestId('split-edit-form');
    await userEvent.click(screen.getByTestId('split-edit-save'));

    expect(await screen.findByTestId('split-edit-error')).toBeInTheDocument();
  });

  it('Dado "Voltar a ser toda minha", então envia a divisão vazia', async () => {
    const { gateway, fixture } = await setup(splitPurchase());

    await userEvent.click(screen.getByTestId('detail-split-edit'));
    await screen.findByTestId('split-edit-form');
    await userEvent.click(screen.getByTestId('split-edit-clear'));
    await fixture.whenStable();

    expect(gateway.shareUpdates[0]?.split).toEqual({ mode: 'BPS', shares: [] });
  });

  it('Dado compra ainda toda minha, então o modal não oferece "Voltar a ser toda minha"', async () => {
    await setup(plainPurchase());

    await userEvent.click(screen.getByTestId('detail-split-edit'));
    await screen.findByTestId('split-edit-form');

    expect(screen.queryByTestId('split-edit-clear')).not.toBeInTheDocument();
  });

  it('Dado o clique duplo em salvar, então só uma requisição sai', async () => {
    const gateway = new TransactionsGatewayStub();
    gateway.shares$ = NEVER;
    await setup(splitPurchase(), gateway);

    await userEvent.click(screen.getByTestId('detail-split-edit'));
    await screen.findByTestId('split-edit-form');
    await userEvent.click(screen.getByTestId('split-edit-save'));
    await userEvent.click(screen.getByTestId('split-edit-save'));

    expect(gateway.shareUpdates).toHaveLength(1);
  });

  it('Dado registrar recebimento da divisão, então o modal só oferece as pessoas da divisão com a compra já escolhida', async () => {
    await setup(splitPurchase());

    await userEvent.click(screen.getByTestId('detail-split-receive'));

    expect(await screen.findByTestId('tpr-save')).toBeDisabled();
    expect(screen.getByTestId('tpr-mode-MOVE')).toBeInTheDocument();
    expect(screen.getByTestId('tpr-mode-IN_BALANCE')).toBeInTheDocument();
  });

  it('Dado a tela com divisão, então não tem violações de acessibilidade', async () => {
    const { container } = await setup(splitPurchase());

    const violations = await axeViolations(container);
    expect(violations, describeViolations(violations)).toEqual([]);
  });
});
