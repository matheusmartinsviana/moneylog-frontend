import { TestBed } from '@angular/core/testing';
import { render, screen } from '@testing-library/angular';

import { MoneyComponent } from '~/app/common/components/money/money.component';
import { ValuesVisibilityService } from '~/app/common/services/values-visibility.service';
import { provideI18nTesting } from '~/testing/i18n-testing';

describe('MoneyComponent', () => {
  it('Dado BRL com a UI em inglês, quando renderizo, então exibe R$ 1.234,56 com números tabulares', async () => {
    const errors = vi.spyOn(console, 'error');
    await render(MoneyComponent, {
      inputs: { value: { amount: '1234.56', currency: 'BRL' } },
      providers: [provideI18nTesting('en')],
    });

    const value = screen.getByTestId('money-value');
    expect(value.textContent?.replace(/\u00a0/g, ' ')).toBe('R$ 1.234,56');
    expect(value).toHaveClass('num');
    expect(getComputedStyle(value).fontVariantNumeric).toBe('tabular-nums');
    expect(errors).not.toHaveBeenCalled();
  });

  it('Dado um valor negativo, então exibe o menos tipográfico', async () => {
    await render(MoneyComponent, {
      inputs: { value: { amount: '-0.10', currency: 'BRL' } },
      providers: [provideI18nTesting('pt')],
    });

    expect(screen.getByTestId('money-value').textContent?.replace(/\u00a0/g, ' ')).toBe(
      '\u2212R$ 0,10',
    );
  });
});

describe('MoneyComponent maskable', () => {
  beforeEach(() => localStorage.clear());

  async function setup(maskable: boolean, hidden: boolean) {
    const result = await render(MoneyComponent, {
      inputs: { value: { amount: '12450.90', currency: 'BRL' }, maskable },
      providers: [provideI18nTesting('pt')],
    });
    TestBed.inject(ValuesVisibilityService).set(hidden);
    result.fixture.detectChanges();
    return result;
  }

  it('Dado valores ocultos e maskable, então mostra R$ ••••• e o leitor ouve "Valor oculto", sem o valor real no DOM', async () => {
    const { container } = await setup(true, true);

    const value = screen.getByTestId('money-value');
    expect(value).toHaveTextContent('R$ •••••');
    expect(value).toHaveTextContent('Valor oculto');
    expect(container.innerHTML).not.toMatch(/12\.450|12450/);
    expect(container.querySelector('[title], [aria-label]')).toBeNull();
  });

  it('Dado valores ocultos e sem maskable, então o valor continua visível', async () => {
    await setup(false, true);

    expect(screen.getByTestId('money-value').textContent?.replace(/\u00a0/g, ' ')).toBe(
      'R$ 12.450,90',
    );
  });

  it('Dado maskable e valores visíveis, então mostra o valor', async () => {
    await setup(true, false);

    expect(screen.getByTestId('money-value').textContent?.replace(/\u00a0/g, ' ')).toBe(
      'R$ 12.450,90',
    );
  });
});
