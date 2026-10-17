import { expect, test } from '@playwright/test';

import { fmt, groupThousands } from './support/format';

test.describe('fmt (helper de valores do e2e)', () => {
  test('Dado um valor com milhares, então agrupa com ponto e usa vírgula decimal', () => {
    expect(fmt('1234567.5')).toBe('R$ 1.234.567,50');
    expect(fmt('999')).toBe('R$ 999,00');
    expect(fmt('1000')).toBe('R$ 1.000,00');
    expect(fmt('-1234.00')).toBe('−R$ 1.234,00');
  });

  test('Dado zero negativo, então não mostra o sinal', () => {
    expect(fmt('-0.00')).toBe('R$ 0,00');
  });

  test('Dado dígitos, então o agrupamento é por três a partir do fim', () => {
    expect(groupThousands('')).toBe('');
    expect(groupThousands('12')).toBe('12');
    expect(groupThousands('123')).toBe('123');
    expect(groupThousands('1234')).toBe('1.234');
    expect(groupThousands('123456')).toBe('123.456');
  });
});
