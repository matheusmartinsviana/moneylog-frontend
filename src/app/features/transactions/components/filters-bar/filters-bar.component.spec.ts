import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';

import { FiltersBarComponent } from '~/app/features/transactions/components/filters-bar/filters-bar.component';
import { defaultFilters } from '~/modules/transactions/core/types/list-filters';
import { provideI18nTesting } from '~/testing/i18n-testing';

async function setup(view: 'records' | 'entries' = 'records') {
  const patch = vi.fn();
  await render(FiltersBarComponent, {
    inputs: { filters: { ...defaultFilters('2026-10-21'), view } },
    on: { patch },
    providers: [provideI18nTesting('pt')],
  });
  await userEvent.click(screen.getByTestId('filters-toggle'));
  return { patch };
}

describe('FiltersBarComponent origem', () => {
  it('Dado a visão Registros, quando escolhe "Atalho", então emite o filtro de origem QUICK_SHORTCUT', async () => {
    const { patch } = await setup();

    await userEvent.click(screen.getByTestId('filter-source'));
    await userEvent.click(screen.getByTestId('filter-source-option-QUICK_SHORTCUT'));

    expect(patch).toHaveBeenCalledWith({ source: 'QUICK_SHORTCUT' });
  });

  it('Dado a visão Competência, então o filtro de origem não aparece (a API só filtra registros)', async () => {
    await setup('entries');

    expect(screen.queryByTestId('filter-source')).not.toBeInTheDocument();
  });
});
