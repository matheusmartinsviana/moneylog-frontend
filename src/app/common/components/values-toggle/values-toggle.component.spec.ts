import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';

import { ValuesToggleComponent } from '~/app/common/components/values-toggle/values-toggle.component';
import { axeViolations, describeViolations } from '~/testing/axe';
import { provideI18nTesting } from '~/testing/i18n-testing';

describe('ValuesToggleComponent', () => {
  beforeEach(() => localStorage.clear());

  it('Dado valores visíveis, então o botão mantém o rótulo fixo e, ao acionar, só muda o aria-pressed', async () => {
    const { container } = await render(ValuesToggleComponent, {
      providers: [provideI18nTesting('pt')],
    });

    const button = screen.getByTestId('values-toggle');
    expect(button).toHaveAccessibleName('Ocultar valores');
    expect(button).toHaveAttribute('aria-pressed', 'false');

    await userEvent.click(button);

    expect(button).toHaveAccessibleName('Ocultar valores');
    expect(button).toHaveAttribute('aria-pressed', 'true');
    const violations = await axeViolations(container);
    expect(violations, describeViolations(violations)).toEqual([]);
  });
});
