export interface DiffLine {
  readonly kind: 'same' | 'added' | 'removed';
  readonly text: string;
}

export const MAX_DIFF_LINES = 20_000;

export const MAX_DIFF_CELLS = 2_000_000;

export function lineDiff(remote: string, mine: string): readonly DiffLine[] | null {
  const a = remote.split('\n');
  const b = mine.split('\n');
  if (a.length > MAX_DIFF_LINES || b.length > MAX_DIFF_LINES) return null;
  if ((a.length + 1) * (b.length + 1) > MAX_DIFF_CELLS) return null;
  const width = b.length + 1;
  const table = new Uint32Array((a.length + 1) * width);
  for (let i = a.length - 1; i >= 0; i--) {
    for (let j = b.length - 1; j >= 0; j--) {
      table[i * width + j] =
        a[i] === b[j]
          ? table[(i + 1) * width + j + 1]! + 1
          : Math.max(table[(i + 1) * width + j]!, table[i * width + j + 1]!);
    }
  }
  const out: DiffLine[] = [];
  let i = 0;
  let j = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      out.push({ kind: 'same', text: a[i]! });
      i++;
      j++;
    } else if (table[(i + 1) * width + j]! >= table[i * width + j + 1]!) {
      out.push({ kind: 'removed', text: a[i]! });
      i++;
    } else {
      out.push({ kind: 'added', text: b[j]! });
      j++;
    }
  }
  for (; i < a.length; i++) out.push({ kind: 'removed', text: a[i]! });
  for (; j < b.length; j++) out.push({ kind: 'added', text: b[j]! });
  return out;
}
