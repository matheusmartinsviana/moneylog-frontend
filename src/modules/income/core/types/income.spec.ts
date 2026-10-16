import { competenceSpan, isValidGenerateWindow } from '~/modules/income/core/types/income';

describe('janela de geração de receitas', () => {
  it('Dado o mesmo mês, então a janela tem 1 mês', () => {
    expect(competenceSpan('2026-10', '2026-10')).toBe(1);
  });

  it('Dado 12 meses, então é válida e 13 meses não é', () => {
    expect(isValidGenerateWindow('2026-01', '2026-12')).toBe(true);
    expect(isValidGenerateWindow('2026-01', '2027-01')).toBe(false);
  });

  it('Dado fim antes do início, então é inválida', () => {
    expect(isValidGenerateWindow('2026-10', '2026-09')).toBe(false);
  });
});
