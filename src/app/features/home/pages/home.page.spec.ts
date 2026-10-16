import { DeferBlockBehavior, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { render, screen, waitFor, within } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { defer, delay, NEVER, Observable, of, Subject, tap, throwError } from 'rxjs';

import { en } from '~/app/common/i18n/translations/en';
import { pt } from '~/app/common/i18n/translations/pt';
import { HomePage } from '~/app/features/home/pages/home.page';
import { DashboardFailure } from '~/modules/dashboard/core/types/dashboard-failure';
import type { DashboardSummary } from '~/modules/dashboard/core/types/dashboard-summary';
import type { UpcomingItem } from '~/modules/dashboard/core/types/upcoming';
import type { IncomeExpenseSeries } from '~/modules/reports/core/types/reports';
import { brl } from '~/testing/accounts-testing';
import { axeViolations, describeViolations } from '~/testing/axe';
import {
  aDashboardSummary,
  anEmptyUpcoming,
  anUpcoming,
  DashboardGatewayStub,
  provideDashboardMock,
  provideDashboardStub,
} from '~/testing/dashboard-testing';
import {
  aSummary,
  MonthlySummaryGatewayStub,
  provideMonthlySummaryStub,
} from '~/testing/etapa5-testing';
import { provideI18nTesting } from '~/testing/i18n-testing';
import {
  NotificationsGatewayStub,
  provideNotificationsStub,
} from '~/testing/notifications-testing';
import {
  anIncomeExpenseSeries,
  provideReportsStub,
  ReportsGatewayStub,
} from '~/testing/reports-testing';
import {
  aTransaction,
  provideTransactionsStub,
  TransactionsGatewayStub,
} from '~/testing/transactions-testing';
import { LedgerGate } from '~/util/api/ledger-gate';
import { formatMoney, type Money } from '~/util/money';

const text = (el: HTMLElement) =>
  el.textContent
    ?.replace(/\u00a0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
const shown = (money: Money) => formatMoney(money).replace(/\u00a0/g, ' ');

function upcomingItem(
  label: string,
  bucket: UpcomingItem['bucket'],
  amount = '10.00',
): UpcomingItem {
  return {
    kind: 'RECURRENCE',
    bucket,
    dueDate: '2026-10-12',
    direction: 'OUT',
    amount: brl(amount),
    label,
    refType: 'RECURRENCE',
    refId: `ref-${label}`,
    items: [],
  };
}

interface Stubs {
  dashboard: DashboardGatewayStub;
  monthly: MonthlySummaryGatewayStub;
  reports: ReportsGatewayStub;
  transactions: TransactionsGatewayStub;
  notifications: NotificationsGatewayStub;
}

function stubs(): Stubs {
  return {
    dashboard: new DashboardGatewayStub(),
    monthly: new MonthlySummaryGatewayStub(),
    reports: new ReportsGatewayStub(),
    transactions: new TransactionsGatewayStub(),
    notifications: new NotificationsGatewayStub(),
  };
}

async function setup(s: Stubs = stubs(), language: 'pt' | 'en' = 'pt') {
  const result = await render(HomePage, {
    deferBlockBehavior: DeferBlockBehavior.Playthrough,
    providers: [
      provideI18nTesting(language),
      provideRouter([]),
      provideDashboardStub(s.dashboard),
      provideMonthlySummaryStub(s.monthly),
      provideReportsStub(s.reports),
      provideTransactionsStub(s.transactions),
      provideNotificationsStub(s.notifications),
    ],
  });
  await result.fixture.whenStable();
  result.fixture.detectChanges();
  return { ...result, ...s };
}

describe('HomePage (Início sucinto)', () => {
  it('Dado que volto de outra tela (nova visita), então o Início pede o resumo de novo, sem cache velho', async () => {
    const s = stubs();
    let calls = 0;
    s.dashboard.summary$ = defer(() => {
      calls++;
      return of(aDashboardSummary());
    });
    const { fixture } = await setup(s);
    expect(calls).toBe(1);

    fixture.componentInstance.ngOnInit();

    expect(calls).toBe(2);
  });

  it('Dado o resumo ainda carregando, então mostra o esqueleto com status acessível e nada de valores', async () => {
    const s = stubs();
    s.dashboard.summary$ = NEVER;
    await setup(s);

    expect(screen.getByTestId('home-loading')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent(pt.home.loading);
    expect(screen.queryByTestId('home-dashboard')).not.toBeInTheDocument();
    expect(screen.queryByTestId('home-register')).not.toBeInTheDocument();
  });

  it('Dado a facade em modo mock (sem contas), então mostra o estado vazio com "adicionar conta"', async () => {
    await render(HomePage, {
      providers: [
        provideI18nTesting('pt'),
        provideRouter([]),
        provideDashboardMock(),
        provideMonthlySummaryStub(),
        provideReportsStub(),
        provideTransactionsStub(),
        provideNotificationsStub(),
      ],
    });

    expect(screen.getByTestId('empty-state-title')).toHaveTextContent(pt.emptyState.home.title);
    expect(screen.getByTestId('empty-state-action-add-account')).toHaveAttribute(
      'href',
      '/accounts/new',
    );
    expect(screen.getByTestId('empty-state-action-import-statement')).toHaveAttribute(
      'aria-disabled',
      'true',
    );
    expect(screen.queryByTestId('home-dashboard')).not.toBeInTheDocument();
  });

  it('Dado uma falha, quando clico em "tentar de novo", então recarrega e mostra o resumo', async () => {
    const s = stubs();
    s.dashboard.summary$ = throwError(() => new Error('rede'));
    const { fixture } = await setup(s);

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByTestId('empty-state-title')).toHaveTextContent(pt.home.error.title);
    const reload = new Subject<DashboardSummary>();
    s.dashboard.summary$ = reload;
    await userEvent.click(screen.getByTestId('empty-state-action-retry'));
    expect(screen.getByTestId('home-loading')).toBeInTheDocument();

    reload.next(aDashboardSummary());
    reload.complete();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByTestId('home-dashboard')).toBeInTheDocument();
  });

  it('Dado o backend negando acesso, então mostra "sem permissão" sem botão de tentar de novo', async () => {
    const s = stubs();
    s.dashboard.summary$ = throwError(() => new DashboardFailure('forbidden'));
    await setup(s);

    expect(screen.getByTestId('empty-state-title')).toHaveTextContent(pt.home.forbidden.title);
    expect(screen.queryByTestId('empty-state-action-retry')).not.toBeInTheDocument();
  });

  it('Dado a recarga em segundo plano que falha, então mantém os dados, avisa e "tentar de novo" recarrega', async () => {
    const s = stubs();
    let calls = 0;
    s.dashboard.summary$ = defer(() => {
      calls++;
      return calls === 2 ? throwError(() => new Error('rede')) : of(aDashboardSummary());
    });
    const { fixture } = await setup(s);

    fixture.componentInstance['dashboard'].reload();
    fixture.detectChanges();

    expect(screen.getByTestId('home-dashboard')).toBeInTheDocument();
    expect(screen.getByTestId('home-refresh-failed')).toHaveTextContent(pt.home.refreshFailed);
    await userEvent.click(screen.getByTestId('home-refresh-retry'));
    fixture.detectChanges();

    expect(calls).toBe(3);
    expect(screen.queryByTestId('home-refresh-failed')).not.toBeInTheDocument();
  });

  describe('com dados', () => {
    it('Dado o resumo, então o saldo disponível é o que o servidor devolveu (sem conta no front)', async () => {
      const summary = aDashboardSummary();
      await setup();

      expect(text(screen.getByTestId('home-wallet-available'))).toContain(
        shown(summary.balances.available),
      );
      expect(text(screen.getByTestId('home-wallet-label'))).toBe(pt.home.wallet.available);
      expect(screen.getByTestId('home-quick-transfer').getAttribute('href')).toMatch(
        /^\/quick-add/,
      );
    });

    it('Dado saldo disponível negativo do servidor, então mostra o menos tipográfico e o aviso', async () => {
      const s = stubs();
      const base = aDashboardSummary();
      s.dashboard.summary$ = of({
        ...base,
        balances: { ...base.balances, available: brl('-120.00') },
      });
      await setup(s);

      expect(text(screen.getByTestId('home-wallet-available'))).toContain('−R$ 120,00');
      expect(screen.getByTestId('home-wallet-negative')).toBeInTheDocument();
    });

    it('Dado o resumo do mês, então o painel analítico mostra receita, despesa e resultado do servidor', async () => {
      const s = stubs();
      s.monthly.result = () => of(aSummary({ partial: false }));
      await setup(s);

      const panel = await screen.findByTestId('home-analytics-income');
      expect(text(panel)).toContain(shown(aSummary().income));
      expect(text(screen.getByTestId('home-analytics-expenses'))).toContain(
        shown(aSummary().expenses),
      );
      expect(text(screen.getByTestId('home-analytics-net'))).toContain(shown(aSummary().net));
    });

    it('Dado falha só no resumo do mês, então só o painel analítico mostra erro e o resto segue', async () => {
      const s = stubs();
      s.monthly.result = () => throwError(() => new Error('rede'));
      await setup(s);

      const analytics = await screen.findByTestId('home-analytics');
      expect(within(analytics).getByRole('alert')).toBeInTheDocument();
      expect(screen.getByTestId('home-wallet-available')).toBeInTheDocument();
      expect(screen.getByTestId('home-chart-panel')).toBeInTheDocument();
    });

    it('Dado movimentações, então a atividade recente mostra as da API na ordem e abre o detalhe', async () => {
      const s = stubs();
      s.transactions.list$ = () =>
        of({
          items: [
            aTransaction({ id: 'tx-1', description: 'Mercado' }),
            aTransaction({ id: 'tx-2', description: 'Padaria' }),
          ],
          hasNext: false,
          totals: {} as never,
        });
      await setup(s);

      const rows = await screen.findAllByTestId('home-recent-item');
      expect(rows).toHaveLength(2);
      expect(screen.getAllByTestId('home-recent-link')[0]).toHaveAttribute(
        'href',
        '/transactions/tx-1',
      );
      expect(s.transactions.listCalls[0]?.pageSize).toBe(5);
    });

    it('Dado nenhuma movimentação, então a atividade recente oferece registrar a primeira', async () => {
      const s = stubs();
      s.transactions.list$ = () => of({ items: [], hasNext: false, totals: {} as never });
      await setup(s);

      expect(await screen.findByTestId('home-recent-empty')).toBeInTheDocument();
    });

    it('Dado falha só nas movimentações, então só a atividade recente mostra erro com tentar de novo', async () => {
      const s = stubs();
      s.transactions.list$ = () => throwError(() => new Error('rede'));
      await setup(s);

      const recent = await screen.findByTestId('home-recent');
      expect(within(recent).getByRole('alert')).toBeInTheDocument();
      expect(screen.getByTestId('home-wallet-available')).toBeInTheDocument();
    });

    it('Dado mais de 3 compromissos, então mostra só 3 dos próximos 7 dias, na ordem do servidor, e leva ao Panorama', async () => {
      const s = stubs();
      s.dashboard.upcoming$ = of(
        anEmptyUpcomingWith([
          upcomingItem('Aluguel', 'TOMORROW', '1800.00'),
          upcomingItem('Internet', 'NEXT_7_DAYS'),
          upcomingItem('Streaming', 'NEXT_7_DAYS'),
          upcomingItem('Academia', 'NEXT_7_DAYS'),
          upcomingItem('Seguro', 'NEXT_30_DAYS'),
        ]),
      );
      await setup(s);

      const rows = screen.getAllByTestId('home-upcoming-item');
      expect(rows.map((row) => row.querySelector('.ub__label')?.textContent)).toEqual([
        'Aluguel',
        'Internet',
        'Streaming',
      ]);
      expect(text(screen.getAllByTestId('home-upcoming-amount')[0]!)).toBe('R$ 1.800,00');
      expect(screen.getByTestId('home-upcoming-all')).toHaveAttribute('href', '/planning/overview');
    });

    it('Dado nada nos próximos 7 dias (só mais adiante), então diz que nada vence', async () => {
      const s = stubs();
      s.dashboard.upcoming$ = of(anEmptyUpcomingWith([upcomingItem('Seguro', 'NEXT_30_DAYS')]));
      await setup(s);

      expect(screen.getByTestId('home-upcoming-empty')).toHaveTextContent(pt.brief.upcoming.empty);
      expect(screen.queryByTestId('home-upcoming-item')).not.toBeInTheDocument();
    });

    it('Dado o Início, então os blocos que saíram (contas, categorias, legado, captura) não estão aqui', async () => {
      await setup();

      for (const id of [
        'home-carousel',
        'home-goal-card',
        'home-debts-total',
        'home-accounts-section',
        'home-categories-total',
        'home-insight',
        'home-legacy',
        'home-quick-capture',
        'home-third-parties-pending',
        'home-goals-summary',
      ]) {
        expect(screen.queryByTestId(id), id).not.toBeInTheDocument();
      }
    });

    it('Dado a projeção, então avisa que é projeção', async () => {
      const s = stubs();
      s.dashboard.summary$ = of(aDashboardSummary({ isProjection: true }));
      await setup(s);

      expect(screen.getByTestId('home-projection')).toHaveTextContent(pt.home.projection);
    });
  });

  describe('composição', () => {
    it('Dado o Início, então há uma h1 e cada seção tem a sua h2', async () => {
      await setup();
      await screen.findByTestId('home-wallet-available');

      expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
      const h2 = screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent?.trim());
      expect(h2).toEqual(
        expect.arrayContaining([
          pt.home.wallet.region,
          pt.home.analytics.title,
          pt.home.chart.title,
        ]),
      );
    });

    it('Dado o Início, então a carteira vem primeiro no DOM', async () => {
      await setup();

      const grid = screen.getByTestId('home-dashboard').querySelector('.home__grid');
      expect(grid?.firstElementChild).toBe(
        screen.getByTestId('home-wallet-header').closest('.home__wallet'),
      );
    });

    it('Dado o saldo pronto e o resumo do mês ainda carregando, então a carteira já aparece', async () => {
      const s = stubs();
      s.monthly.result = () => NEVER;
      await setup(s);

      expect(screen.getByTestId('home-wallet-available')).toBeInTheDocument();
      expect(screen.getByTestId('home-analytics-loading')).toBeInTheDocument();
    });
  });

  describe('+ Registrar', () => {
    it('Dado o botão, quando abro o menu e escolho "Emprestei", então abre o Novo registro já em "Emprestei"', async () => {
      await setup();
      const router = TestBed.inject(Router);
      const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);

      expect(screen.getByTestId('home-register-open')).toHaveAttribute('href', '/quick-add');
      await userEvent.click(screen.getByTestId('home-register-menu'));
      await userEvent.click(await screen.findByTestId('home-register-menu-item-loan'));

      expect(navigate).toHaveBeenCalledWith(['/quick-add'], { queryParams: { mode: 'loan' } });
    });
  });

  it('Dado o inglês, então os rótulos vêm traduzidos', async () => {
    await setup(stubs(), 'en');

    expect(screen.getByText(en.brief.upcoming.title)).toBeInTheDocument();
    expect(screen.getByText(en.brief.register)).toBeInTheDocument();
    expect(screen.getByTestId('home-wallet-label')).toHaveTextContent(en.home.wallet.available);
    expect(screen.getByTestId('home-analytics')).toHaveTextContent(en.home.analytics.title);
  });

  it('Dado o Início completo, então não há violações de acessibilidade', async () => {
    const s = stubs();
    s.monthly.result = () => of(aSummary({ partial: false }));
    const { container } = await setup(s);
    await screen.findByTestId('home-analytics-summary');

    const violations = await axeViolations(container);
    expect(violations, describeViolations(violations)).toEqual([]);
  }, 30_000);
});

function anEmptyUpcomingWith(items: UpcomingItem[]) {
  return { ...anEmptyUpcoming(), items };
}

describe('HomePage: fila das leituras do razão (R13)', () => {
  class Meter {
    inFlight = 0;
    max = 0;
    readonly started: string[] = [];

    track<T>(name: string, value: T): Observable<T> {
      return defer(() => {
        this.started.push(name);
        this.max = Math.max(this.max, ++this.inFlight);
        let open = true;
        const done = () => {
          if (!open) return;
          open = false;
          this.inFlight--;
        };
        return of(value).pipe(delay(15), tap({ complete: done, error: done, unsubscribe: done }));
      });
    }
  }

  it('Dado todos os blocos, então no máximo 2 leituras do razão ficam em voo e a ordem é a das prioridades', async () => {
    const meter = new Meter();
    const s = stubs();
    s.dashboard.summary$ = meter.track<DashboardSummary>('dashboard', aDashboardSummary());
    s.dashboard.upcoming$ = meter.track('upcoming', anUpcoming());
    s.monthly.result = () => meter.track('monthly', aSummary({ partial: false }));
    s.reports.incomeExpensesResult = () =>
      meter.track<IncomeExpenseSeries>('overview', anIncomeExpenseSeries());
    await setup(s);

    await waitFor(() => expect(screen.getByTestId('home-chart-totals')).toBeInTheDocument(), {
      timeout: 3000,
    });

    expect(meter.max).toBeLessThanOrEqual(2);
    expect(meter.started).toEqual(['dashboard', 'upcoming', 'overview', 'monthly']);
    expect(meter.inFlight).toBe(0);
    expect(new LedgerGate().maxInFlight).toBe(2);
  });
});
