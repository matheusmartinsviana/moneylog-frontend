export const CATEGORY_KINDS = ['EXPENSE', 'INCOME'] as const;
export type CategoryKind = (typeof CATEGORY_KINDS)[number];

export interface Category {
  readonly id: string;
  readonly name: string;
  readonly kind: CategoryKind;
  readonly system: boolean;
  readonly archived: boolean;
  readonly version: number;
}

export interface CategoryInput {
  readonly name: string;
  readonly kind: CategoryKind;
}

export interface CategoryRename {
  readonly name: string;
  readonly version: number;
}
