import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';

import { GREETING_HOUR } from '~/app/common/components/workspace-header/workspace-header.component';
import { pt } from '~/app/common/i18n/translations/pt';
import { WalletHeaderComponent } from '~/app/features/home/components/wallet-header/wallet-header.component';
import { UnreadCountFacade } from '~/modules/notifications/core/facades/unread-count.facade';
import { axeViolations, describeViolations } from '~/testing/axe';
import { provideI18nTesting } from '~/testing/i18n-testing';
import {
  NotificationsGatewayStub,
  provideNotificationsStub,
} from '~/testing/notifications-testing';
import type { Money } from '~/util/money';

const BRL = (amount: string): Money => ({ amount, currency: 'BRL' });

async function setup(
  options: {
    available?: Money;
    displayName?: string | null;
    embedded?: boolean;
    hour?: number;
    unread?: number;
  } = {},
) {
  localStorage.clear();
  const gateway = new NotificationsGatewayStub();
  gateway.unread = options.unread ?? 0;
  const result = await render(WalletHeaderComponent, {
    inputs: {
      available: options.available ?? BRL('12450.90'),
      displayName: options.displayName ?? null,
      embedded: options.embedded ?? false,
    },
    providers: [
      provideI18nTesting('pt'),
      provideRouter([]),
      provideNotificationsStub(gateway),
      { provide: GREETING_HOUR, useValue: () => options.hour ?? 9 },
    ],
  });
  TestBed.inject(UnreadCountFacade).refresh();
  await result.fixture.whenStable();
  result.fixture.detectChanges();
  return result;
}

describe('WalletHeaderComponent', () => {
  it('Dado o modo embutido, Quando renderiza, Então o conteúdo fica sem painel próprio para caber no painel da página', async () => {
    const { container } = await setup({ embedded: true });

    expect(container.querySelector('app-glass-panel')).toBeNull();
    expect(screen.getByTestId('home-wallet-available')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'Carteira' })).toBeInTheDocument();
  });

  it('Dado o modo padrão, Quando renderiza, Então o conteúdo vem no painel de vidro da carteira', async () => {
    const { container } = await setup();

    expect(container.querySelector('app-glass-panel.glass-panel--wallet')).not.toBeNull();
  });

  it('Dado available 12450.90, Quando renderiza, Então o número principal é o disponível com o rótulo "Disponível" e BRL estático', async () => {
    await setup();

    expect(screen.getByTestId('home-wallet-label')).toHaveTextContent('Disponível');
    expect(screen.getByTestId('home-wallet-available').textContent).toMatch(/R\$\s*12\.450,90/);
    expect(screen.queryByText('Em contas')).not.toBeInTheDocument();
    expect(screen.queryByTestId('home-wallet-negative')).not.toBeInTheDocument();
  });

  it('Dado available negativo, Quando renderiza, Então mostra o sinal, a cor de risco e o aviso do catálogo', async () => {
    await setup({ available: BRL('-300.00') });

    expect(screen.getByTestId('home-wallet-available').textContent).toMatch(/[-−]\s*R\$/);
    expect(screen.getByTestId('home-wallet-available')).toHaveClass('is-negative');
    expect(screen.getByTestId('home-wallet-negative')).toHaveTextContent(pt.home.wallet.negative);
  });

  it('Dado "Nova transação", Quando renderizado, Então é um link para /quick-add alcançável por teclado', async () => {
    await setup();
    const link = screen.getByTestId('home-wallet-new');

    expect(link).toHaveAttribute('href', '/quick-add');
    expect(link).toHaveTextContent('Nova transação');
    for (let i = 0; i < 6 && document.activeElement !== link; i++) await userEvent.tab();
    expect(link).toHaveFocus();
  });

  it('Dado displayName preenchido, Quando renderiza, Então a saudação da faixa de hora inclui o nome', async () => {
    await setup({ displayName: 'Ana', hour: 14 });

    expect(screen.getByTestId('home-wallet-greeting')).toHaveTextContent('Boa tarde, Ana');
  });

  it('Dado displayName nulo, Quando renderiza, Então a saudação vem sem nome', async () => {
    await setup({ displayName: null, hour: 22 });

    expect(screen.getByTestId('home-wallet-greeting')).toHaveTextContent(/^Boa noite$/);
  });

  it('Dado o cabeçalho, Então não há violações de acessibilidade', async () => {
    const { container } = await setup({ unread: 2 });

    const violations = await axeViolations(container);
    expect(violations, describeViolations(violations)).toEqual([]);
  });
});
