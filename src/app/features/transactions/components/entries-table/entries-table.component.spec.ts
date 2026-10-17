import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';

import { EntriesTableComponent } from '~/app/features/transactions/components/entries-table/entries-table.component';
import type { Entry } from '~/modules/transactions/core/types/entry';
import { provideI18nTesting } from '~/testing/i18n-testing';
import { anEntry } from '~/testing/transactions-testing';

async function setup(items: readonly Entry[]) {
  const opened: Entry[] = [];
  await render(EntriesTableComponent, {
    inputs: { items },
    on: { open: (entry: Entry) => opened.push(entry) },
    providers: [provideI18nTesting('pt')],
  });
  return opened;
}

describe('EntriesTableComponent, lista estreita', () => {
  it('Dado os lançamentos, então cada item é um botão nativo com nome acessível', async () => {
    await setup([anEntry({ description: 'Notebook' })]);

    const item = screen.getByTestId('entry-item-0');
    expect(item.tagName).toBe('BUTTON');
    expect(item).toHaveAttribute('type', 'button');
    expect(item).toHaveAccessibleName(/Notebook/);
    expect(item.closest('li')).not.toHaveAttribute('tabindex');
  });

  it('Dado o clique no item, então emite open com o lançamento', async () => {
    const entry = anEntry({ description: 'Notebook' });
    const opened = await setup([entry]);

    await userEvent.click(screen.getByTestId('entry-item-0'));

    expect(opened).toEqual([entry]);
  });

  it('Dado o foco por Tab e Enter ou Espaço, então abre o lançamento', async () => {
    const entry = anEntry({ description: 'Notebook' });
    const opened = await setup([entry]);

    await userEvent.tab();
    expect(screen.getByTestId('entry-item-0')).toHaveFocus();
    await userEvent.keyboard('{Enter}');
    await userEvent.keyboard(' ');

    expect(opened).toEqual([entry, entry]);
  });
});
