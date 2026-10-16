import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { of } from 'rxjs';

import { pt } from '~/app/common/i18n/translations/pt';
import { ToastService } from '~/app/common/services/toast.service';
import { CardCashOutPage } from '~/app/features/cards/pages/card-cash-out.page';
import {
  AccountsGatewayStub,
  anAccount,
  failWith,
  provideAccountsStub,
} from '~/testing/accounts-testing';
import { axeViolations, describeViolations } from '~/testing/axe';
import { aDebt, DebtsGatewayStub, provideDebtsStub } from '~/testing/debts-testing';
import { provideI18nTesting } from '~/testing/i18n-testing';
import { aPerson, PeopleGatewayStub, providePeopleStub } from '~/testing/people-testing';

@Component({ selector: 'app-dummy', template: '' })
class DummyComponent {}

async function setup(debts = new DebtsGatewayStub(), people = new PeopleGatewayStub()) {
  const accounts = new AccountsGatewayStub();
  accounts.accounts = [anAccount({ id: 'acc-1', name: 'Nubank' })];
  people.people = [aPerson({ id: 'person-1', name: 'João' })];
  const result = await render(CardCashOutPage, {
    inputs: { id: 'card-1' },
    providers: [
      provideI18nTesting('pt'),
      provideDebtsStub(debts),
      providePeopleStub(people),
      provideAccountsStub(accounts),
      provideRouter([
        { path: 'cards/:id', component: DummyComponent },
        { path: 'debts/:id', component: DummyComponent },
      ]),
    ],
  });
  await result.fixture.whenStable();
  return {
    ...result,
    debts,
    router: TestBed.inject(Router),
    toast: TestBed.inject(ToastService),
  };
}

const input = (id: string) => screen.getByTestId(id) as HTMLInputElement;
const type = async (id: string, value: string) => {
  await userEvent.clear(input(id));
  await userEvent.type(input(id), value);
};
const pick = async (id: string, value: string) => {
  await userEvent.click(screen.getByTestId(id));
  await userEvent.click(screen.getByTestId(`${id}-option-${value}`));
};

describe('CardCashOutPage', () => {
  it('Dado o formulário novo, então explica que só os juros são custo e pede conta, valor, parcelas e total', async () => {
    await setup();

    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(pt.cardCashOut.title);
    expect(screen.getByTestId('card-cash-out-form')).toHaveTextContent(pt.cardCashOut.description);
    for (const id of [
      'card-cash-out-account',
      'card-cash-out-principal',
      'card-cash-out-installments',
      'card-cash-out-total',
      'card-cash-out-first-invoice',
    ]) {
      expect(screen.getByTestId(id)).toBeInTheDocument();
    }
    expect(screen.queryByTestId('card-cash-out-rate')).not.toBeInTheDocument();
  });

  it('Dado Pix para mim com o total, quando salvo, então o POST leva conta, principal, parcelas e total com uma chave, e abre a dívida', async () => {
    const { debts, fixture, router, toast } = await setup();
    const navigate = vi.spyOn(router, 'navigate');
    await pick('card-cash-out-account', 'acc-1');
    await type('card-cash-out-principal', '1.000,00');
    await userEvent.click(screen.getByTestId('card-cash-out-installments-increase'));
    await userEvent.click(screen.getByTestId('card-cash-out-installments-increase'));
    await userEvent.click(screen.getByTestId('card-cash-out-installments-increase'));
    await type('card-cash-out-total', '1.120,00');

    await userEvent.click(screen.getByTestId('card-cash-out-save'));
    await fixture.whenStable();

    expect(debts.cashOuts).toHaveLength(1);
    expect(debts.cashOuts[0]).toMatchObject({
      cardId: 'card-1',
      accountId: 'acc-1',
      beneficiaryPersonId: null,
      principal: '1000.00',
      installments: 4,
      totalWithInterest: '1120.00',
      rateBps: null,
    });
    expect(debts.createKeys[0]).toBeTruthy();
    expect(toast.toasts()[0]?.message).toBe(pt.cardCashOut.toast);
    expect(navigate).toHaveBeenCalledWith(['/debts', 'debt-cash-out']);
  });

  it('Dado Pix para uma pessoa com taxa, então envia o beneficiário e a taxa em pontos-base, sem conta nem total', async () => {
    const { debts, fixture } = await setup();
    await userEvent.click(screen.getByTestId('card-cash-out-destination-PERSON'));
    await pick('card-cash-out-person', 'person-1');
    await type('card-cash-out-principal', '500,00');
    await userEvent.click(screen.getByTestId('card-cash-out-cost-mode-RATE'));
    await type('card-cash-out-rate', '3,5');

    await userEvent.click(screen.getByTestId('card-cash-out-save'));
    await fixture.whenStable();

    expect(debts.cashOuts[0]).toMatchObject({
      accountId: null,
      beneficiaryPersonId: 'person-1',
      totalWithInterest: null,
      rateBps: 350,
    });
  });

  it('Dado o formulário vazio, quando salvo, então mostra os erros e não chama o backend', async () => {
    const { debts, fixture } = await setup();

    await userEvent.click(screen.getByTestId('card-cash-out-save'));
    fixture.detectChanges();

    expect(debts.cashOuts).toEqual([]);
    expect(screen.getByTestId('card-cash-out-form')).toBeInTheDocument();
  });

  it('Dado taxa inválida, então não envia', async () => {
    const { debts, fixture } = await setup();
    await pick('card-cash-out-account', 'acc-1');
    await type('card-cash-out-principal', '500,00');
    await userEvent.click(screen.getByTestId('card-cash-out-cost-mode-RATE'));
    await type('card-cash-out-rate', '150');

    await userEvent.click(screen.getByTestId('card-cash-out-save'));
    fixture.detectChanges();

    expect(debts.cashOuts).toEqual([]);
  });

  it('Dado 422 CARD_CASH_OUT_INVALID, então o erro vai ao campo do valor e o digitado fica', async () => {
    const debts = new DebtsGatewayStub();
    debts.next = failWith(422, 'CARD_CASH_OUT_INVALID');
    const { fixture } = await setup(debts);
    await pick('card-cash-out-account', 'acc-1');
    await type('card-cash-out-principal', '1.000,00');
    await type('card-cash-out-total', '900,00');

    await userEvent.click(screen.getByTestId('card-cash-out-save'));
    fixture.detectChanges();

    expect(screen.getByText(pt.errors.codes['CARD_CASH_OUT_INVALID']!)).toBeInTheDocument();
    expect(screen.queryByTestId('card-cash-out-error')).not.toBeInTheDocument();
    expect(input('card-cash-out-total').value).toBe('900,00');
  });

  it('Dado falha de rede ao salvar, então avisa e oferece tentar de novo com a mesma chave', async () => {
    const debts = new DebtsGatewayStub();
    debts.next = failWith(0, 'NETWORK');
    const { fixture } = await setup(debts);
    await pick('card-cash-out-account', 'acc-1');
    await type('card-cash-out-principal', '1.000,00');
    await type('card-cash-out-total', '1.120,00');

    await userEvent.click(screen.getByTestId('card-cash-out-save'));
    fixture.detectChanges();
    debts.next = of(aDebt({ id: 'debt-cash-out' }));
    await userEvent.click(screen.getByTestId('card-cash-out-retry'));
    await fixture.whenStable();

    expect(debts.createKeys).toHaveLength(2);
    expect(debts.createKeys[1]).toBe(debts.createKeys[0]);
  });

  it('Dado falha ao carregar contas e pessoas, então avisa e deixa tentar de novo', async () => {
    const people = new PeopleGatewayStub();
    const { fixture } = await setup(undefined, people);
    expect(screen.queryByTestId('card-cash-out-load-error')).not.toBeInTheDocument();
    people.listError = failWith(500, 'INTERNAL_ERROR');
    fixture.componentInstance['retryLoad']();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(screen.getByTestId('card-cash-out-load-error')).toBeInTheDocument();
  });

  it('Dado o formulário, então não tem violações de acessibilidade', async () => {
    const { container } = await setup();

    const violations = await axeViolations(container);

    expect(violations, describeViolations(violations)).toEqual([]);
  });
});
