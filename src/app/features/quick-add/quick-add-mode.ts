export const MAIN_MODES = [
  'expense',
  'pix',
  'debit',
  'income',
  'transfer',
  'credit',
  'loan',
] as const;
export const MORE_MODES = ['investment', 'adjustment', 'refund'] as const;
export const PEOPLE_MODES = ['received', 'debt'] as const;
export const PEOPLE_DATA_MODES = ['loan', ...PEOPLE_MODES] as const;
export const QUICK_ADD_MODES = [...MAIN_MODES, ...MORE_MODES, ...PEOPLE_MODES] as const;
export type QuickAddMode = (typeof QUICK_ADD_MODES)[number];

export const DEFAULT_MODE: QuickAddMode = 'expense';

export function parseMode(value: string | null): QuickAddMode {
  return QUICK_ADD_MODES.find((mode) => mode === value) ?? DEFAULT_MODE;
}

export const MODE_GROUPS = [
  { key: 'spending', modes: ['expense', 'pix', 'debit', 'credit'] },
  { key: 'inflow', modes: ['income'] },
  { key: 'between', modes: ['transfer', 'investment'] },
  { key: 'people', modes: ['loan', 'received', 'debt'] },
  { key: 'other', modes: ['refund', 'adjustment'] },
] as const satisfies readonly { key: string; modes: readonly QuickAddMode[] }[];
