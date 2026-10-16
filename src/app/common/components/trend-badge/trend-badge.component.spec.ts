import { render, screen } from '@testing-library/angular';

import { TrendBadgeComponent } from '~/app/common/components/trend-badge/trend-badge.component';
import { axeViolations, describeViolations } from '~/testing/axe';
import { provideI18nTesting } from '~/testing/i18n-testing';

async function setup(ratio: string | null, language: 'pt' | 'en' | 'es' = 'pt') {
  return render(TrendBadgeComponent, {
    inputs: { ratio, cy: 'tb' },
    providers: [provideI18nTesting(language)],
  });
}

describe('TrendBadgeComponent', () => {
  it('Dado um valor positivo, então mostra seta para cima, "+" e o texto "Aumento"', async () => {
    const { container } = await setup('0.0420');

    const badge = screen.getByTestId('tb');
    expect(badge).toHaveTextContent('+4,2%');
    expect(badge).toHaveTextContent('Aumento');
    expect(badge.querySelector('[data-icon="arrowUp"]')).not.toBeNull();
    const violations = await axeViolations(container);
    expect(violations, describeViolations(violations)).toEqual([]);
  });

  it('Dado um valor negativo, então mostra seta para baixo, sinal de menos e o texto "Queda"', async () => {
    await setup('-0.0420');

    const badge = screen.getByTestId('tb');
    expect(badge).toHaveTextContent('−4,2%');
    expect(badge).toHaveTextContent('Queda');
    expect(badge.querySelector('[data-icon="arrowDown"]')).not.toBeNull();
  });

  it('Dado null, então diz "Sem base de comparação" e não mostra número nem seta', async () => {
    await setup(null);

    const badge = screen.getByTestId('tb');
    expect(screen.getByText('Sem base de comparação')).toBeVisible();
    expect(screen.getByText('Sem base de comparação')).not.toHaveClass('visually-hidden');
    expect(badge.querySelector('svg')).toBeNull();
    expect(badge.querySelector('.trend__value')).toBeNull();
  });

  it('Dado zero, então não afirma aumento nem queda', async () => {
    await setup('0.0000');

    const badge = screen.getByTestId('tb');
    expect(badge).toHaveTextContent('Sem variação');
    expect(badge).not.toHaveTextContent('Aumento');
    expect(badge).not.toHaveTextContent('Queda');
  });

  it('Dado o idioma inglês, então o texto acessível sai em inglês', async () => {
    await setup('0.1', 'en');

    expect(screen.getByTestId('tb')).toHaveTextContent('Increase');
  });
});
