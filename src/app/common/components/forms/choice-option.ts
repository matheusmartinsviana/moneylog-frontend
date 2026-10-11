export interface ChoiceOption {
  readonly value: string;
  readonly label: string;
  readonly disabled?: boolean;
  readonly hint?: string;
  readonly group?: string;
  readonly lang?: string;
}

export function nextEnabled(
  options: readonly ChoiceOption[],
  from: number,
  step: 1 | -1,
  wrap = true,
): number {
  const total = options.length;
  for (let i = 1; i <= total; i++) {
    const index = from + step * i;
    if (!wrap && (index < 0 || index >= total)) return from;
    const wrapped = (index + total) % total;
    if (!options[wrapped]?.disabled) return wrapped;
  }
  return from;
}

export function edgeEnabled(options: readonly ChoiceOption[], edge: 'first' | 'last'): number {
  const indexes = options.map((_, i) => i).filter((i) => !options[i]?.disabled);
  return (edge === 'first' ? indexes[0] : indexes[indexes.length - 1]) ?? -1;
}
