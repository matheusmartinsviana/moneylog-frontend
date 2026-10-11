import type { ActivatedRouteSnapshot } from '@angular/router';

import { isModalNavigation, MODAL_ROUTE } from '~/app/common/routing/modal-route';

function snapshot(
  options: {
    data?: Record<string, unknown>;
    outlet?: string;
    children?: ActivatedRouteSnapshot[];
  } = {},
): ActivatedRouteSnapshot {
  return {
    data: options.data ?? {},
    outlet: options.outlet ?? 'primary',
    children: options.children ?? [],
  } as unknown as ActivatedRouteSnapshot;
}

const page = () => snapshot({ children: [snapshot()] });
const withModalRoute = () =>
  snapshot({ children: [snapshot({ children: [snapshot({ data: MODAL_ROUTE })] })] });
const withModalOutlet = () => snapshot({ children: [snapshot(), snapshot({ outlet: 'modal' })] });

describe('isModalNavigation', () => {
  it('Dado abrir um modal por rota (página -> /x/new), então não troca de página', () => {
    expect(isModalNavigation(page(), withModalRoute())).toBe(true);
  });

  it('Dado fechar um modal por rota (/x/new -> página), então não troca de página', () => {
    expect(isModalNavigation(withModalRoute(), page())).toBe(true);
  });

  it('Dado o modal no outlet auxiliar (quick-add), então conta como modal', () => {
    expect(isModalNavigation(page(), withModalOutlet())).toBe(true);
    expect(isModalNavigation(withModalOutlet(), page())).toBe(true);
  });

  it('Dado a troca entre duas páginas, então mantém a transição de página', () => {
    expect(isModalNavigation(page(), page())).toBe(false);
  });
});
