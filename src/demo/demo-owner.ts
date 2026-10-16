import { addMonthsKey, dateIn } from '~/demo/demo-dates';
import { accountView, recurrenceView } from '~/demo/demo-views';
import { money, type S, type World } from '~/demo/demo-world';

const CARDS_MINE = [182_000, 214_500, 168_000, 196_000, 175_000, 201_000];
const OFF_CARD_FIXED = [239_000, 239_000, 239_000, 239_000, 239_000, 239_000];
const OFF_CARD_VARIABLE = [62_000, 48_000, 71_000, 55_000, 60_000, 52_000];
const REAL_ESTATE = [0, 0, 0, 0, 0, 0];
const INCOME = 750_000;

const cash = (w: World): number =>
  w.accounts
    .map((a) => accountView(w, a))
    .filter((a) => a.liquidity === 'CASH')
    .reduce((sum, a) => sum + Math.round(Number(a.currentBalance.amount) * 100), 0);

export function ownerStatementView(w: World, from: string, months: number): S['OwnerStatement'] {
  const opening = cash(w);
  let running = opening;
  const rows: S['OwnerStatementMonth'][] = [];
  for (let i = 0; i < months; i += 1) {
    const competence = addMonthsKey(from, i);
    const cards = CARDS_MINE[i % CARDS_MINE.length]!;
    const fixed = OFF_CARD_FIXED[i % OFF_CARD_FIXED.length]!;
    const variable = OFF_CARD_VARIABLE[i % OFF_CARD_VARIABLE.length]!;
    const estate = REAL_ESTATE[i % REAL_ESTATE.length]!;
    const outflow = cards + fixed + variable + estate;
    const surplus = INCOME - outflow;
    running += surplus;
    rows.push({
      competence,
      income: {
        total: money(INCOME),
        receivedInAccount: money(INCOME),
        appliedToDebt: money(0),
        items: [
          {
            source: 'RECURRENCE',
            refId: w.recurrences.find((r) => r.type === 'INCOME')?.id ?? null,
            date: dateIn(addMonthsKey(competence, -1), 5),
            amount: money(INCOME),
            status: i === 0 ? 'RECEIVED' : 'PLANNED',
            confidence: 'CONFIRMED',
          },
        ],
      },
      outflow: {
        cardsMine: money(cards),
        cardsGross: money(cards + 24_000),
        subscriptionsMine: money(24_990),
        offCard: {
          fixed: money(fixed),
          variable: money(variable),
          byMethod: [
            { method: 'BOLETO', amount: money(fixed) },
            { method: 'PIX', amount: money(variable) },
          ],
        },
        realEstateMine: money(estate),
        total: money(outflow),
      },
      companyReimbursable: money(0),
      surplus: money(surplus),
      endBalance: money(running),
      negative: running < 0,
      receivablesPending: money(i === 0 ? 45_000 : 0),
    });
  }
  return {
    asOf: w.today,
    view: 'MINE',
    incomeLagMonths: 1,
    openingBalance: money(opening),
    months: rows,
    negativeMonths: rows.filter((r) => r.negative).map((r) => r.competence),
    warnings: [],
  };
}

export function purchaseSimulationView(
  w: World,
  input: {
    amount: string;
    installments: number;
    interestRatePerMonthBps?: number;
    firstInstallmentMonth: string;
    cancelSubscriptionIds?: string[];
  },
): S['PurchaseSimulation'] {
  const total = Math.round(Number(input.amount) * 100);
  const n = Math.max(1, input.installments);
  const rate = (input.interestRatePerMonthBps ?? 0) / 10_000;
  const installment =
    rate > 0 ? Math.round((total * rate) / (1 - (1 + rate) ** -n)) : Math.round(total / n);
  const statement = ownerStatementView(w, input.firstInstallmentMonth, Math.min(n, 12));
  const cuts = (input.cancelSubscriptionIds?.length ?? 0) * 3_990;
  const rows = statement.months.map((month): S['SimulationMonth'] => {
    const before = Math.round(Number(month.surplus.amount) * 100);
    const after = before - installment;
    return {
      competence: month.competence,
      surplusBefore: money(before),
      surplusAfter: money(after),
      delta: money(-installment),
      negativeAfter: after < 0,
      cutsMonthly: cuts > 0 ? money(cuts) : null,
      surplusAfterWithCuts: cuts > 0 ? money(after + cuts) : null,
      negativeAfterWithCuts: cuts > 0 ? after + cuts < 0 : null,
      confidence: 'CONFIRMED',
    };
  });
  const lowest = Math.min(...rows.map((r) => Math.round(Number(r.surplusAfter.amount) * 100)));
  const negative = rows.some((r) => r.negativeAfter);
  const classification: S['SimulationClassification'] = negative
    ? 'INCOMPATIBLE'
    : lowest < 100_000
      ? 'VIABLE_WITH_PLANNING'
      : 'SUSTAINABLE';
  return {
    installmentAmount: money(installment),
    total: money(installment * n),
    months: rows,
    horizon: {
      from: rows[0]!.competence,
      to: rows[rows.length - 1]!.competence,
      calculatedMonths: rows.length,
      requiredMonths: n,
      limited: n > rows.length,
    },
    classification,
    reasons: [
      negative
        ? {
            code: 'NEGATIVE_WITHOUT_CUTS',
            competence: rows.find((r) => r.negativeAfter)!.competence,
            params: {},
          }
        : { code: 'NO_NEGATIVE_MONTH', competence: null, params: {} },
    ],
    endBalanceMin: money(Math.round(Number(statement.openingBalance.amount) * 100) + lowest),
    endBalanceMinWithCuts: cuts > 0 ? money(lowest + cuts) : null,
    financingWarning: rate > 0,
  };
}

export function subscriptionListView(w: World): S['SubscriptionList'] {
  const items = w.recurrences
    .filter(
      (r) =>
        r.type === 'EXPENSE' && /streaming|assinatura|música|musica|nuvem|app/i.test(r.description),
    )
    .map((r): S['Subscription'] => ({
      recurrence: { ...recurrenceView(w, r), isSubscription: true },
      monthlyEquivalent: money(r.cents),
      monthlyEquivalentMine: money(r.cents),
      lastChargedAmount: money(r.cents),
      ended: false,
    }));
  const totalCents = items.reduce(
    (sum, i) => sum + Math.round(Number(i.monthlyEquivalent.amount) * 100),
    0,
  );
  return {
    hasNext: false,
    items,
    totalMonthly: money(totalCents),
    totalMonthlyMine: money(totalCents),
    byScope: [{ scope: 'PERSONAL', monthly: money(totalCents) }],
    overlaps: [],
  };
}
