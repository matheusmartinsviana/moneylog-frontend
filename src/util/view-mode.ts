export const VIEW_MODES = ['MINE', 'GROSS'] as const;
export type ViewMode = (typeof VIEW_MODES)[number];

export const DEFAULT_VIEW: ViewMode = 'MINE';

export function parseView(value: string | null | undefined): ViewMode {
  return VIEW_MODES.find((mode) => mode === value) ?? DEFAULT_VIEW;
}
