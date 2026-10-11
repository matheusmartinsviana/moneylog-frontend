export function counterpartyName(debt: {
  readonly person: { readonly name: string } | null;
  readonly creditorName: string | null;
}): string {
  return debt.person?.name ?? debt.creditorName ?? '';
}
