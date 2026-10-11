export interface Slice<T> {
  readonly items: readonly T[];
  readonly hasNext: boolean;
}

export interface OccurrenceSlice<T> extends Slice<T> {
  readonly overdueTruncated: boolean;
}

export const MAX_PAGE_SIZE = 50;
