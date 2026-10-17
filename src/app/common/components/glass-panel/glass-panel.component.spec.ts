import { render, screen } from '@testing-library/angular';

import { GlassPanelComponent } from '~/app/common/components/glass-panel/glass-panel.component';
import { axeViolations, describeViolations } from '~/testing/axe';

describe('GlassPanelComponent', () => {
  it('Dado o painel padrão, então aplica a superfície de vidro e projeta o conteúdo', async () => {
    const { container } = await render(`<app-glass-panel data-cy="p">conteúdo</app-glass-panel>`, {
      imports: [GlassPanelComponent],
    });

    const panel = screen.getByTestId('p');
    expect(panel).toHaveClass('glass-panel');
    expect(panel).not.toHaveClass('glass-panel--strong');
    expect(panel).toHaveTextContent('conteúdo');
    const violations = await axeViolations(container);
    expect(violations, describeViolations(violations)).toEqual([]);
  });

  it.each([
    ['card', 'glass-panel--card'],
    ['control', 'glass-panel--control'],
    ['wallet', 'glass-panel--wallet'],
  ] as const)('Dado a variante %s, então aplica %s', async (variant, className) => {
    await render(
      `<app-glass-panel data-cy="p" [variant]="variant" [strong]="true" [flat]="true" />`,
      {
        imports: [GlassPanelComponent],
        componentProperties: { variant },
      },
    );

    const panel = screen.getByTestId('p');
    expect(panel).toHaveClass(className, 'glass-panel--strong', 'glass-panel--flat');
  });
});
