import type { ActivatedRouteSnapshot } from '@angular/router';

import {
  isModalNavigation,
  isModalOnSamePage,
  MODAL_ROUTE,
} from '~/app/common/routing/modal-route';

function snapshot(
  options: {
    data?: Record<string, unknown>;
    outlet?: string;
    url?: string;
    children?: ActivatedRouteSnapshot[];
  } = {},
): ActivatedRouteSnapshot {
  return {
    data: options.data ?? {},
    outlet: options.outlet ?? 'primary',
    url: (options.url ?? '')
      .split('/')
      .filter(Boolean)
      .map((path) => ({ path })),
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

describe('isModalOnSamePage', () => {
  const list = () => snapshot({ children: [snapshot({ url: 'accounts' })] });
  const listWithForm = () =>
    snapshot({
      children: [
        snapshot({ url: 'accounts', children: [snapshot({ url: 'new', data: MODAL_ROUTE })] }),
      ],
    });
  const otherPageWithForm = () =>
    snapshot({
      children: [
        snapshot({ url: 'goals', children: [snapshot({ url: 'new', data: MODAL_ROUTE })] }),
      ],
    });

  it('Dado abrir o modal sobre a lista, então a página de trás é a mesma (sem voltar ao topo)', () => {
    expect(isModalOnSamePage(list(), listWithForm())).toBe(true);
  });

  it('Dado fechar o modal de volta para a lista, então a página de trás é a mesma', () => {
    expect(isModalOnSamePage(listWithForm(), list())).toBe(true);
  });

  it('Dado o modal no outlet auxiliar sobre a mesma página, então é a mesma página', () => {
    const quick = snapshot({
      children: [snapshot({ url: 'accounts' }), snapshot({ outlet: 'modal', url: 'quick-add' })],
    });
    expect(isModalOnSamePage(list(), quick)).toBe(true);
  });

  it('Dado sair de um modal para outra página, então troca de página (volta ao topo)', () => {
    expect(
      isModalOnSamePage(listWithForm(), snapshot({ children: [snapshot({ url: 'goals' })] })),
    ).toBe(false);
    expect(isModalOnSamePage(listWithForm(), otherPageWithForm())).toBe(false);
  });

  it('Dado a troca entre duas páginas sem modal, então não é modal', () => {
    expect(isModalOnSamePage(list(), snapshot({ children: [snapshot({ url: 'goals' })] }))).toBe(
      false,
    );
  });
});
