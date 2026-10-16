import { addMonthsKey, dateIn } from '~/demo/demo-dates';
import { money, type S, type World } from '~/demo/demo-world';

const stamp = (iso: string) => `${iso}T12:00:00Z`;

export function incomeProfileViews(w: World): S['IncomeProfile'][] {
  return [
    {
      id: '00000011-0000-4000-8000-000000000001',
      source: 'Empresa Exemplo Ltda',
      gross: money(900_000),
      dependents: 1,
      advance: { dayOfMonth: 20, percentBps: 4000 },
      balanceDayOfMonth: 5,
      deductions: [
        {
          kind: 'BENEFIT',
          label: 'Plano de saúde',
          amount: money(18_000),
          percentBps: null,
          startsOn: null,
          endsOn: null,
          debtId: null,
        },
        {
          kind: 'UNION',
          label: 'Sindicato',
          amount: null,
          percentBps: 100,
          startsOn: null,
          endsOn: null,
          debtId: null,
        },
      ],
      thirteenth: { enabled: true, firstInstallmentMonth: 11 },
      status: 'ACTIVE',
      version: 1,
      createdAt: stamp(dateIn(addMonthsKey(w.month, -3), 10)),
      updatedAt: stamp(dateIn(addMonthsKey(w.month, -1), 10)),
    },
  ];
}

export function taxTablesView(year: number): S['TaxTableList'] {
  const source = {
    agency: 'Receita Federal (exemplo)',
    norm: 'Norma sintética de demonstração',
    url: 'https://example.com/tabelas',
    consultedOn: `${year}-01-10`,
  };
  const band = (from: number, upTo: number | null, rateBps: number, deduction: number) => ({
    from: money(from),
    upTo: upTo === null ? null : money(upTo),
    rateBps,
    deduction: money(deduction),
  });
  return {
    year,
    items: [
      {
        kind: 'INSS',
        version: 1,
        effectiveFrom: `${year}-01-01`,
        effectiveTo: null,
        basis: 'COMPETENCE',
        method: 'PROGRESSIVE_BY_BAND',
        brackets: [
          band(0, 162_000, 750, 0),
          band(162_000, 290_000, 900, 0),
          band(290_000, 435_000, 1200, 0),
          band(435_000, null, 1400, 0),
        ],
        contributionCeiling: money(850_000),
        dependentDeduction: null,
        simplifiedDiscountLimit: null,
        reduction: null,
        sources: [source],
      },
      {
        kind: 'IRRF',
        version: 1,
        effectiveFrom: `${year}-01-01`,
        effectiveTo: null,
        basis: 'PAYMENT_DATE',
        method: 'RATE_MINUS_DEDUCTION',
        brackets: [
          band(0, 242_800, 0, 0),
          band(242_800, 282_600, 750, 18_200),
          band(282_600, 375_100, 1500, 39_400),
          band(375_100, 466_500, 2250, 67_500),
          band(466_500, null, 2750, 90_800),
        ],
        contributionCeiling: null,
        dependentDeduction: money(18_900),
        simplifiedDiscountLimit: money(60_700),
        reduction: null,
        sources: [source],
      },
    ],
  };
}

export function assetViews(w: World): S['Asset'][] {
  const point = (monthsAgo: number, cents: number) => ({
    date: dateIn(addMonthsKey(w.month, -monthsAgo), 5),
    balance: money(cents),
    recordedAt: stamp(dateIn(addMonthsKey(w.month, -monthsAgo), 5)),
  });
  return [
    {
      id: '00000012-0000-4000-8000-000000000001',
      kind: 'FGTS',
      name: 'FGTS',
      employer: 'Empresa Exemplo Ltda',
      balance: money(2_450_000),
      balanceDate: dateIn(w.month, 2),
      monthlyDeposit: money(72_000),
      availability: 'RESERVED',
      countsAsReserve: false,
      status: 'ACTIVE',
      history: [point(0, 2_450_000), point(1, 2_378_000), point(2, 2_306_000)],
      version: 1,
      createdAt: stamp(dateIn(addMonthsKey(w.month, -6), 5)),
      updatedAt: stamp(dateIn(w.month, 2)),
    },
    {
      id: '00000012-0000-4000-8000-000000000002',
      kind: 'OTHER',
      name: 'Tesouro Selic',
      employer: null,
      balance: money(1_800_000),
      balanceDate: dateIn(w.month, 3),
      monthlyDeposit: null,
      availability: 'AVAILABLE',
      countsAsReserve: true,
      status: 'ACTIVE',
      history: [],
      version: 1,
      createdAt: stamp(dateIn(addMonthsKey(w.month, -6), 5)),
      updatedAt: stamp(dateIn(w.month, 3)),
    },
  ];
}

export function netWorthView(): S['NetWorthOverview'] {
  return {
    availableCash: money(3_348_200),
    availableAssets: money(1_800_000),
    reservedAssets: money(2_450_000),
    receivablesPending: money(30_000),
    debts: money(525_000),
    emergencyReserve: {
      amount: money(1_800_000),
      monthlyBase: money(197_170),
      coverageMonths: '9.1',
      targetMonths: 6,
      targetAmount: money(1_183_020),
      missingToTarget: money(0),
    },
  };
}

export function purchaseGroupViews(w: World): S['PurchaseGroup'][] {
  const lastDue = dateIn(addMonthsKey(w.month, 5), w.card.dueDay);
  return [
    {
      id: '00000013-0000-4000-8000-000000000001',
      name: 'Notebook',
      interest: false,
      status: 'ACTIVE',
      total: money(150_000),
      remaining: money(120_000),
      myRemaining: money(120_000),
      installmentAmountPerMonth: money(30_000),
      lastDueDate: lastDue,
      divergence: null,
      members: [
        {
          transactionId: '00000014-0000-4000-8000-000000000001',
          card: { id: w.card.id, name: w.card.name },
          description: 'Notebook',
          totalInstallments: 5,
          remainingInstallments: 4,
          installmentAmount: money(30_000),
          total: money(150_000),
          remaining: money(120_000),
          myRemaining: money(120_000),
          lastDueDate: lastDue,
        },
      ],
      version: 1,
      createdAt: stamp(dateIn(addMonthsKey(w.month, -1), 12)),
      updatedAt: stamp(dateIn(addMonthsKey(w.month, -1), 12)),
    },
  ];
}

export function purchaseGroupCommitmentsView(
  w: World,
  until: string,
): S['PurchaseGroupCommitments'] {
  const byMonth = Array.from({ length: 5 }, (_, i) => ({
    competence: addMonthsKey(w.month, i + 1),
    amount: money(30_000),
    mine: money(30_000),
  })).filter((m) => m.competence <= until);
  return {
    until,
    committed: money(30_000 * byMonth.length),
    committedMine: money(30_000 * byMonth.length),
    byMonth,
  };
}

export function incomePreviewView(w: World, month: string): S['IncomePreview'] {
  const gross = 900_000;
  const inss = 82_800;
  const irrf = 0;
  const health = 18_000;
  const union = 9_000;
  const net = gross - inss - irrf - health - union;
  const advance = Math.floor((net * 4000) / 10_000);
  return {
    month,
    gross: money(gross),
    inss: money(inss),
    irrf: money(irrf),
    fixedDeductions: [
      { kind: 'BENEFIT', label: 'Plano de saúde', amount: money(health), debtId: null },
      { kind: 'UNION', label: 'Sindicato', amount: money(union), debtId: null },
    ],
    loanDeductions: [],
    net: money(net),
    advance: { date: dateIn(month, 20), amount: money(advance) },
    balance: { date: dateIn(addMonthsKey(month, 1), 5), amount: money(net - advance) },
    thirteenth: null,
    taxTables: [
      { kind: 'INSS', version: 1, effectiveFrom: `${w.month.slice(0, 4)}-01-01` },
      { kind: 'IRRF', version: 1, effectiveFrom: `${w.month.slice(0, 4)}-01-01` },
    ],
  };
}
