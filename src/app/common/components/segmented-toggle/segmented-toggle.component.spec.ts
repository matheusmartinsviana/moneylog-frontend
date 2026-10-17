import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';

import { SegmentedToggleComponent } from '~/app/common/components/segmented-toggle/segmented-toggle.component';
import { axeViolations, describeViolations } from '~/testing/axe';

const OPTIONS = [
  { value: 'bars', label: 'Barras' },
  { value: 'line', label: 'Linha' },
  { value: 'table', label: 'Tabela' },
];

async function setup(value = 'bars') {
  const valueChange = vi.fn();
  const result = await render(
    `<app-segmented-toggle [options]="options" [value]="value" label="Visualização" cy="seg" (valueChange)="valueChange($event)" />`,
    {
      imports: [SegmentedToggleComponent],
      componentProperties: { options: OPTIONS, value, valueChange },
    },
  );
  return { ...result, valueChange };
}

describe('SegmentedToggleComponent', () => {
  it('Dado as opções, então é um radiogroup com a opção atual marcada', async () => {
    const { container } = await setup('line');

    expect(screen.getByRole('radiogroup', { name: 'Visualização' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Linha' })).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByRole('radio', { name: 'Barras' })).toHaveAttribute('aria-checked', 'false');
    const violations = await axeViolations(container);
    expect(violations, describeViolations(violations)).toEqual([]);
  });

  it('Dado o foco na opção atual, quando usa seta para a direita, então seleciona a próxima e o foco acompanha', async () => {
    const { valueChange } = await setup();
    screen.getByRole('radio', { name: 'Barras' }).focus();

    await userEvent.keyboard('{ArrowRight}');

    expect(valueChange).toHaveBeenLastCalledWith('line');
    expect(screen.getByRole('radio', { name: 'Linha' })).toHaveFocus();
    expect(screen.getByRole('radio', { name: 'Linha' })).toHaveAttribute('aria-checked', 'true');
  });

  it('Dado a primeira opção, quando usa seta para a esquerda, então volta para a última', async () => {
    await setup();
    screen.getByRole('radio', { name: 'Barras' }).focus();

    await userEvent.keyboard('{ArrowLeft}');

    expect(screen.getByRole('radio', { name: 'Tabela' })).toHaveFocus();
    expect(screen.getByRole('radio', { name: 'Tabela' })).toHaveAttribute('aria-checked', 'true');
  });

  it('Dado o foco numa opção, quando aperta Enter ou Espaço, então ela é selecionada', async () => {
    const { valueChange } = await setup();
    const table = screen.getByRole('radio', { name: 'Tabela' });
    table.focus();

    await userEvent.keyboard('{Enter}');
    expect(valueChange).toHaveBeenLastCalledWith('table');

    const line = screen.getByRole('radio', { name: 'Linha' });
    line.focus();
    await userEvent.keyboard(' ');
    expect(valueChange).toHaveBeenLastCalledWith('line');
  });

  it('Dado a seleção, então só a opção atual entra na ordem de tabulação', async () => {
    await setup('line');

    expect(screen.getByRole('radio', { name: 'Linha' })).toHaveAttribute('tabindex', '0');
    expect(screen.getByRole('radio', { name: 'Barras' })).toHaveAttribute('tabindex', '-1');
  });
});
