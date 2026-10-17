import type { Money } from '~/util/money';

export const SPLIT_MODES = ['BPS', 'EQUAL', 'AMOUNT'] as const;
export type SplitMode = (typeof SPLIT_MODES)[number];

export const FULL_BPS = 10000;
export const MAX_SPLIT_PEOPLE = 20;

export interface ShareInput {
  readonly personId: string | null;
  readonly bps?: number;
  readonly amount?: string;
}

export interface SplitInput {
  readonly mode: SplitMode;
  readonly shares: readonly ShareInput[];
}

export interface PersonShareLine {
  readonly personId: string | null;
  readonly bps: number | null;
  readonly amount: Money | null;
}

export interface PersonAmount {
  readonly personId: string | null;
  readonly amount: Money;
}

export interface SplitRow {
  readonly personId: string | null;
  readonly percent: string | null;
  readonly amount: string | null;
}

export interface SplitDraft {
  readonly mode: SplitMode;
  readonly includeOwner: boolean;
  readonly owner: SplitRow;
  readonly others: readonly SplitRow[];
}

export type SplitProblem =
  | 'PERSON_MISSING'
  | 'PERSON_REPEATED'
  | 'PERCENT_INVALID'
  | 'PERCENT_SUM'
  | 'AMOUNT_MISSING'
  | 'NO_ONE';

const PERCENT = /^(\d{1,3})(?:[.,](\d{1,2}))?$/;

export function percentToBps(text: string | null): number | null {
  const match = PERCENT.exec((text ?? '').trim());
  if (!match) return null;
  const whole = Number.parseInt(match[1] ?? '0', 10);
  const fraction = Number.parseInt((match[2] ?? '').padEnd(2, '0'), 10);
  const bps = whole * 100 + fraction;
  return bps >= 1 && bps <= FULL_BPS ? bps : null;
}

export function bpsToPercent(bps: number): string {
  const whole = Math.trunc(bps / 100);
  const fraction = bps % 100;
  return fraction === 0 ? String(whole) : `${whole}.${String(fraction).padStart(2, '0')}`;
}

function participants(draft: SplitDraft): readonly SplitRow[] {
  const withOwner = draft.mode === 'EQUAL' ? draft.includeOwner : true;
  return withOwner ? [draft.owner, ...draft.others] : [...draft.others];
}

export function splitProblem(draft: SplitDraft): SplitProblem | null {
  if (draft.others.some((row) => row.personId === null)) return 'PERSON_MISSING';
  const ids = draft.others.map((row) => row.personId);
  if (new Set(ids).size !== ids.length) return 'PERSON_REPEATED';
  const rows = participants(draft);
  if (rows.length === 0) return 'NO_ONE';
  if (draft.mode === 'BPS') {
    const values = rows.map((row) => percentToBps(row.percent));
    if (values.some((value) => value === null)) return 'PERCENT_INVALID';
    const sum = values.reduce<number>((total, value) => total + (value ?? 0), 0);
    return sum === FULL_BPS ? null : 'PERCENT_SUM';
  }
  if (draft.mode === 'AMOUNT') {
    const missing = rows.some((row) => row.amount === null || row.amount.trim() === '');
    return missing ? 'AMOUNT_MISSING' : null;
  }
  return null;
}

export function isOwnerOnly(draft: SplitDraft): boolean {
  return draft.others.length === 0;
}

export function toSplitInput(draft: SplitDraft): SplitInput | null {
  if (isOwnerOnly(draft)) return null;
  const rows = participants(draft);
  const shares = rows.map((row, index): ShareInput => {
    const personId = rows[index] === draft.owner ? null : row.personId;
    if (draft.mode === 'BPS') return { personId, bps: percentToBps(row.percent) ?? 0 };
    if (draft.mode === 'AMOUNT') return { personId, amount: row.amount ?? '' };
    return { personId };
  });
  return { mode: draft.mode, shares };
}

export function draftFromLines(mode: SplitMode, lines: readonly PersonShareLine[]): SplitDraft {
  const rowOf = (line: PersonShareLine): SplitRow => ({
    personId: line.personId,
    percent: line.bps === null ? null : bpsToPercent(line.bps),
    amount: line.amount?.amount ?? null,
  });
  const owner = lines.find((line) => line.personId === null);
  return {
    mode,
    includeOwner: owner !== undefined,
    owner: owner ? rowOf(owner) : { personId: null, percent: null, amount: null },
    others: lines.filter((line) => line.personId !== null).map(rowOf),
  };
}
