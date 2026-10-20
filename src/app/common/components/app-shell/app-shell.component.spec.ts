import { DeferBlockBehavior, TestBed } from '@angular/core/testing';
import { Router, TitleStrategy } from '@angular/router';
import { render, screen, within } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';

import { App } from '~/app/app';
import { routes } from '~/app/app.routes';
import {
  BOTTOM_NAV_ITEMS,
  MORE_ITEMS,
  NavKey,
  SIDEBAR_ITEMS,
} from '~/app/common/components/app-shell/navigation';
import { ownerGuard } from '~/app/common/guards/role.guard';
import { I18nService } from '~/app/common/i18n/i18n.service';
import { pt } from '~/app/common/i18n/translations/pt';
import { I18nTitleStrategy } from '~/app/common/services/i18n-title.strategy';
import { ValuesVisibilityService } from '~/app/common/services/values-visibility.service';
import { provideAuthenticatedSession } from '~/testing/auth-testing';
import { axeViolations, describeViolations } from '~/testing/axe';
import { provideDashboardMock } from '~/testing/dashboard-testing';
import { provideI18nTesting } from '~/testing/i18n-testing';
import { provideBusinessModules } from '~/testing/modules-testing';

async function navigate(url: string, language: 'pt' | 'en' | 'es' = 'pt') {
  const result = await render(App, {
    deferBlockBehavior: DeferBlockBehavior.Playthrough,
    routes,
    initialRoute: url,
    providers: [
      provideI18nTesting(language),
      { provide: TitleStrategy, useExisting: I18nTitleStrategy },
      provideDashboardMock(),
      provideBusinessModules(),
      provideAuthenticatedSession(),
    ],
  });
  await screen.findByTestId('header-profile');
  await screen.findByTestId('sidebar-more');
  return result;
}

function sidebarNav(): HTMLElement {
  const nav = screen.getByTestId('sidebar').querySelector('nav');
  expect(nav).toHaveAttribute('aria-label', pt.shell.primaryNavigation);
  return nav as HTMLElement;
}

const SECTION_KEYS = [
  'home',
  'transactions',
  'quickAdd',
  'goals',
  'cards',
  'accounts',
  'planning',
  'people',
  'notes',
  'import',
  'insights',
  'settings',
  'budgets',
] as const satisfies readonly NavKey[];

const PATHS: Record<(typeof SECTION_KEYS)[number], string> = {
  home: '/',
  transactions: '/transactions',
  quickAdd: '/quick-add',
  goals: '/goals',
  cards: '/cards',
  accounts: '/accounts',
  planning: '/planning',
  people: '/people',
  notes: '/notes',
  import: '/import',
  insights: '/insights',
  settings: '/settings',
  budgets: '/budgets',
};

const IMPLEMENTED = new Set<NavKey>([
  'home',
  'accounts',
  'cards',
  'transactions',
  'quickAdd',
  'people',
  'planning',
  'goals',
  'notes',
  'import',
  'insights',
  'budgets',
]);

describe('App shell e rotas', () => {
  it('Dado a barra inferior, então tem exatamente Visão geral · Transações · Orçamentos · Metas · Configurações, nessa ordem', async () => {
    await navigate('/');

    const nav = screen.getByRole('navigation', { name: pt.shell.bottomNavigation });
    const links = within(nav).getAllByRole('link');
    expect(links.map((link) => link.getAttribute('href'))).toEqual([
      '/',
      '/transactions',
      '/budgets',
      '/goals',
      '/settings',
    ]);
    expect(
      links.map((link) =>
        (
          link.querySelector('.bottom-nav__label-full') ?? link.querySelector('.bottom-nav__label')
        )?.textContent?.trim(),
      ),
    ).toEqual(['Visão geral', 'Transações', 'Orçamentos', 'Metas', 'Configurações']);
    expect(links.every((link) => link.hasAttribute('data-cy'))).toBe(true);
    expect(BOTTOM_NAV_ITEMS.map((item) => item.key)).toEqual([
      'home',
      'transactions',
      'budgets',
      'goals',
      'settings',
    ]);
    expect(within(nav).queryByTestId('bottom-nav-quickAdd')).toBeNull();
    expect(within(nav).queryByTestId('bottom-nav-more')).toBeNull();
  });

  it('Dado o cabeçalho, então o botão de menu leva a /more sem recarregar', async () => {
    const { fixture } = await navigate('/');

    const menu = screen.getByTestId('header-menu');
    expect(menu).toHaveAccessibleName('Mais');
    await userEvent.click(menu);
    await fixture.whenStable();

    expect(TestBed.inject(Router).url).toBe('/more');
  });

  it('Dado a barra inferior, então usa o trilho de vidro em barra', async () => {
    await navigate('/');

    const nav = screen.getByTestId('bottom-nav');
    expect(nav).toHaveClass('glass-rail', 'glass-rail--bar');
  });

  it.each([
    ['pt', ['Visão geral', 'Transações', 'Orçamentos', 'Metas', 'Configurações']],
    ['en', ['Overview', 'Transactions', 'Budgets', 'Goals', 'Settings']],
    ['es', ['Resumen', 'Transacciones', 'Presupuestos', 'Metas', 'Ajustes']],
  ] as const)(
    'Dado o idioma %s, então a barra inferior traz os 5 rótulos',
    async (language, names) => {
      await navigate('/', language);

      const nav = screen.getByTestId('bottom-nav');
      const full = Array.from(nav.querySelectorAll('li a'), (link) =>
        (
          link.querySelector('.bottom-nav__label-full') ?? link.querySelector('.bottom-nav__label')
        )?.textContent?.trim(),
      );
      expect(full).toEqual(names);
    },
  );

  it('Dado a sidebar, então lista só o essencial, "Mais" e o rodapé (Configurações e Sair), sem Dream Board', async () => {
    await navigate('/');

    const nav = sidebarNav();
    expect(Array.from(nav.querySelectorAll('li a'), (link) => link.textContent?.trim())).toEqual([
      'Início',
      'Movimentações',
      'Contas',
      'Cartões',
      'Metas',
      'Orçamentos',
      'Planejamento',
      'Resumo do mês',
      'Posso comprar?',
    ]);
    expect(within(nav).getByTestId('sidebar-more')).toHaveAccessibleName('Mais');
    const footer = nav.querySelector('.sidebar__footer')!;
    expect(footer.querySelector('[data-cy="sidebar-settings"]')).toHaveAttribute(
      'href',
      '/settings',
    );
    expect(footer.querySelector('[data-cy="sidebar-signOut"]')).toBeInTheDocument();
    expect(SIDEBAR_ITEMS).toHaveLength(18);
    expect(screen.queryByText(/dream board/i)).not.toBeInTheDocument();
  });

  it('Dado a sidebar, então a ordem do Tab é marca, Novo registro, seções, Mais, Configurações e Sair', async () => {
    await navigate('/');

    const nav = sidebarNav();
    const order = Array.from(nav.querySelectorAll('a, button'), (el) => el.getAttribute('data-cy'));
    expect(order).toEqual([
      'sidebar-brand',
      'sidebar-quickAdd',
      'sidebar-home',
      'sidebar-transactions',
      'sidebar-accounts',
      'sidebar-cards',
      'sidebar-goals',
      'sidebar-budgets',
      'sidebar-planning',
      'sidebar-statement',
      'sidebar-simulator',
      'sidebar-more',
      'sidebar-settings',
      'sidebar-signOut',
    ]);
  });

  it('Dado "Mais" na sidebar, então abre um popover com os atalhos secundários e leva à rota escolhida', async () => {
    await navigate('/');

    const more = within(sidebarNav()).getByTestId('sidebar-more');
    expect(more).toHaveAttribute('aria-expanded', 'false');
    await userEvent.click(more);

    const menu = await screen.findByRole('menu', { name: 'Mais' }, { timeout: 5000 });
    expect(
      within(menu)
        .getAllByRole('menuitem')
        .map((item) => item.textContent?.trim()),
    ).toEqual([
      'Vault',
      'Notas',
      'Pessoas',
      'Insights',
      'IA (desligada)',
      'MCP',
      'Importar extrato',
      'Notificações',
    ]);
    await userEvent.click(within(menu).getByRole('menuitem', { name: 'Vault' }));
    await vi.waitFor(() => expect(TestBed.inject(Router).url).toBe('/vault'), { timeout: 5000 });
  });

  it('Dado o shell, então o cabeçalho do workspace e a janela existem e a página mantém um h1 e um main (T192, T194)', async () => {
    await navigate('/');

    expect(screen.getByTestId('shell-window')).toBeInTheDocument();
    expect(screen.getByTestId('workspace-header')).toBeInTheDocument();
    expect(screen.queryByTestId('workspace-greeting')).not.toBeInTheDocument();
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(screen.getAllByRole('main')).toHaveLength(1);
  });

  it('Dado a sidebar, então a marca e o "Novo registro" ficam dentro do landmark de navegação', async () => {
    await navigate('/');

    const nav = sidebarNav();
    expect(screen.getAllByRole('navigation', { hidden: true })).toHaveLength(2);
    expect(nav).toContainElement(screen.getByTestId('sidebar-brand'));
    expect(nav).toContainElement(screen.getByTestId('sidebar-quickAdd'));
  });

  it('Dado a rota ativa, então o item é destacado com aria-current="page" só nele', async () => {
    await navigate('/cards');

    const sidebar = sidebarNav();
    expect(screen.getByTestId('sidebar-cards')).toHaveAttribute('aria-current', 'page');
    expect(screen.getByTestId('sidebar-home')).not.toHaveAttribute('aria-current');
    expect(sidebar.querySelectorAll('[aria-current="page"]')).toHaveLength(1);
    expect(screen.getByTestId('sidebar-cards')).toHaveClass('is-active');
  });

  it('Dado a rota de Metas no mobile, então o item da barra inferior fica com aria-current="page"', async () => {
    await navigate('/goals');

    const bottom = screen.getByRole('navigation', { name: pt.shell.bottomNavigation });
    expect(within(bottom).getByRole('link', { name: 'Metas' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(within(bottom).getByRole('link', { name: 'Visão geral' })).not.toHaveAttribute(
      'aria-current',
    );
  });

  it('Dado /more, então lista as seções que não estão na barra inferior', async () => {
    await navigate('/more');

    const list = screen.getByTestId('more-list');
    expect(
      within(list)
        .getAllByRole('link')
        .map((link) => link.textContent?.trim()),
    ).toEqual([
      'Contas',
      'Cartões',
      'Planejamento',
      'Resumo do mês',
      'Posso comprar?',
      'Vault',
      'Notas',
      'Pessoas',
      'Insights',
      'IAdesligada',
      'MCP',
      'Importar extrato',
      'Notificações',
    ]);
    expect(MORE_ITEMS.map((item) => item.path)).toEqual([
      '/accounts',
      '/cards',
      '/planning',
      '/statement',
      '/simulator',
      '/vault',
      '/notes',
      '/people',
      '/insights',
      '/ai',
      '/mcp',
      '/import',
      '/notifications',
    ]);
  });

  it.each(
    SECTION_KEYS.filter(
      (key): key is Exclude<(typeof SECTION_KEYS)[number], 'quickAdd'> => !IMPLEMENTED.has(key),
    ),
  )(
    'Dado a rota de %s, então mostra o h1 e o estado vazio da seção com ações indisponíveis',
    async (key) => {
      await navigate(PATHS[key]);

      expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(pt.nav[key]);
      expect(screen.getByTestId('empty-state-title')).toHaveTextContent(pt.emptyState[key].title);
      expect(screen.getByTestId('empty-state-description')).toHaveTextContent(
        pt.emptyState[key].description,
      );
      const actions = screen.getAllByTestId(/^empty-state-action-/);
      expect(actions.length).toBeGreaterThan(0);
      actions.forEach((action) => expect(action).toHaveAttribute('aria-disabled', 'true'));
      expect(screen.getByTestId('empty-state-coming-soon')).toHaveTextContent(
        pt.emptyState.comingSoon,
      );
      expect(document.title).toBe(`${pt.nav[key]} · moneylog`);
    },
  );

  it('Dado a rota de accounts em modo mock, então mostra o h1 e o estado vazio com "Adicionar conta" habilitado', async () => {
    await navigate('/accounts');

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(pt.nav.accounts);
    expect(screen.getByTestId('empty-state-title')).toHaveTextContent(pt.emptyState.accounts.title);
    expect(screen.getByTestId('empty-state-action-add-account')).toHaveAttribute(
      'href',
      '/accounts/new',
    );
    expect(document.title).toBe(`${pt.nav.accounts} · moneylog`);
  });

  it('Dado a rota de cards em modo mock, então mostra o h1 e o estado vazio com "Adicionar cartão" habilitado', async () => {
    await navigate('/cards');

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(pt.nav.cards);
    expect(screen.getByTestId('empty-state-title')).toHaveTextContent(pt.emptyState.cards.title);
    const action = screen.getByTestId('empty-state-action-add-card');
    expect(action).toHaveAttribute('href', '/cards/new');
    expect(action).not.toHaveAttribute('aria-disabled');
    expect(document.title).toBe(`${pt.nav.cards} · moneylog`);
  });

  it('Dado valores ocultos ou visíveis, então o título do documento nunca contém valores', async () => {
    await navigate('/accounts');
    const hidden = TestBed.inject(ValuesVisibilityService);

    for (const state of [false, true]) {
      hidden.set(state);
      expect(document.title).toBe(`${pt.nav.accounts} · moneylog`);
      expect(document.title).not.toMatch(/\d|R\$|•/);
    }
  });

  it('Dado uma rota desconhecida, então mostra "não encontrada" com link para o Início', async () => {
    await navigate('/rota-que-nao-existe');

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(pt.notFound.pageTitle);
    expect(screen.getByRole('link', { name: pt.notFound.goHome })).toHaveAttribute('href', '/');
    expect(document.title).toBe(`${pt.notFound.pageTitle} · moneylog`);
  });

  it('Dado as rotas, então toda seção é lazy (loadChildren) dentro do shell', () => {
    const children = (routes.find((route) => route.component)?.children ?? []).filter(
      (route) => !route.path?.startsWith('dev/') && !route.outlet,
    );
    expect(children).toHaveLength(23);
    children.forEach((route) => {
      expect(route.loadChildren).toBeTypeOf('function');
      expect(route.component).toBeUndefined();
    });
  });

  it('Dado as rotas, então o convite é público e fora do shell, e a gestão de pessoas exige o dono', () => {
    const invitation = routes.find((route) => route.path === 'convite');
    const users = routes
      .find((route) => route.component)
      ?.children?.find((route) => route.path === 'users');
    expect(invitation?.component).toBeUndefined();
    expect(invitation?.canMatch).toBeUndefined();
    expect(users?.canMatch).toEqual([ownerGuard]);
  });

  it('Dado as rotas, então o login fica fora do shell e o shell fica atrás do authGuard', () => {
    const login = routes.find((route) => route.path === 'login');
    const shell = routes.find((route) => route.component);
    expect(login?.component).toBeUndefined();
    expect(login?.canMatch).toHaveLength(1);
    expect(shell?.canMatch).toHaveLength(1);
  });

  it('Dado a navegação por todas as rotas, então o console fica sem erro nem warning', async () => {
    const error = vi.spyOn(console, 'error');
    const warn = vi.spyOn(console, 'warn');
    const { navigate: go } = await navigate('/');

    for (const path of [...Object.values(PATHS), '/more', '/nao-existe']) {
      await go(path);
    }

    expect(error).not.toHaveBeenCalled();
    expect(warn).not.toHaveBeenCalled();
  });

  it('Dado o idioma em inglês, então a navegação e o título usam en', async () => {
    await navigate('/cards', 'en');

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Cards');
    expect(document.title).toBe('Cards · moneylog');
  });

  it('Dado a troca de idioma, então o título do documento acompanha', async () => {
    const { fixture } = await navigate('/cards');

    await TestBed.inject(I18nService).use('es');
    await fixture.whenStable();

    expect(document.title).toBe('Tarjetas · moneylog');
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Tarjetas');
  });

  it('Dado o link "pular para o conteúdo", quando ativo, então o foco vai para o main', async () => {
    await navigate('/goals');

    await userEvent.click(screen.getByTestId('skip-to-content'));

    expect(screen.getByRole('main')).toHaveFocus();
  });

  it('Dado o teclado (mobile), então o "pular", o cabeçalho e os itens da barra inferior são alcançáveis com Tab', async () => {
    await navigate('/import');

    await userEvent.tab();
    expect(screen.getByTestId('skip-to-content')).toHaveFocus();
    await userEvent.tab();
    expect(screen.getByTestId('header-menu')).toHaveFocus();
    await userEvent.tab();
    expect(screen.getByTestId('global-search-input')).toHaveFocus();
    await userEvent.tab();
    expect(screen.getByTestId('values-toggle')).toHaveFocus();
    await userEvent.tab();
    expect(screen.getByTestId('header-bell')).toHaveFocus();
    await userEvent.tab();
    expect(screen.getByTestId('header-theme-toggle')).toHaveFocus();
    await userEvent.tab();
    expect(screen.getByTestId('header-profile')).toHaveFocus();
    for (let i = 0; i < 10 && document.activeElement !== screen.getByTestId('bottom-nav-home'); i++)
      await userEvent.tab();
    for (const key of ['home', 'transactions', 'budgets', 'goals', 'settings']) {
      expect(screen.getByTestId(`bottom-nav-${key}`)).toHaveFocus();
      await userEvent.tab();
    }
  });

  it('Dado a sidebar, então todo item é link com data-cy e rótulo acessível (inclusive recolhida)', async () => {
    await navigate('/');

    const links = within(screen.getByTestId('sidebar')).getAllByRole('link', { hidden: true });
    links.forEach((link) => {
      expect(link).toHaveAttribute('data-cy');
      expect(link.textContent?.trim()).not.toBe('');
    });
  });

  it('Dado o shell com uma página, então o axe não aponta violações', async () => {
    const { container } = await navigate('/transactions');

    const violations = await axeViolations(container);
    expect(violations, describeViolations(violations)).toEqual([]);
  }, 30_000);
});
