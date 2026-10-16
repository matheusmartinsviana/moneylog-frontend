import { render, screen } from '@testing-library/angular';

import { MetricTileComponent } from '~/app/common/components/metric-tile/metric-tile.component';
import { axeViolations, describeViolations } from '~/testing/axe';

describe('MetricTileComponent', () => {
  it('Dado rótulo, valor e complemento, então mostra os três', async () => {
    const { container } = await render(
      `<app-metric-tile label="Taxa de poupança" cy="m">41,1%<span tileExtra>do mês</span></app-metric-tile>`,
      { imports: [MetricTileComponent] },
    );

    const tile = screen.getByTestId('m');
    expect(tile).toHaveTextContent('Taxa de poupança');
    expect(tile).toHaveTextContent('41,1%');
    expect(tile).toHaveTextContent('do mês');
    const violations = await axeViolations(container);
    expect(violations, describeViolations(violations)).toEqual([]);
  });
});
