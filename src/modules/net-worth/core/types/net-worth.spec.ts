import { isValidTargetMonths } from '~/modules/net-worth/core/types/net-worth';

describe('isValidTargetMonths', () => {
  it('Dado 1 a 60 meses inteiros, então é válida', () => {
    expect(isValidTargetMonths(1)).toBe(true);
    expect(isValidTargetMonths(60)).toBe(true);
  });

  it('Dado vazio, zero, 61 ou fração, então é inválida', () => {
    expect(isValidTargetMonths(null)).toBe(false);
    expect(isValidTargetMonths(0)).toBe(false);
    expect(isValidTargetMonths(61)).toBe(false);
    expect(isValidTargetMonths(2.5)).toBe(false);
  });
});
