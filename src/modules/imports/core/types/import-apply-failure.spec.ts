import { applyFailureOf } from '~/modules/imports/core/types/import-apply-failure';
import { fastestMs } from '~/testing/timing';
import type { Problem } from '~/util/api/problem';

const problem = (extra: Partial<Problem>): Problem => ({
  status: 422,
  code: 'IMPORT_APPLY_FAILED',
  fieldErrors: [],
  traceId: null,
  retryAfterSeconds: null,
  ...extra,
});

describe('applyFailureOf', () => {
  it('Dado outro código, então devolve null', () => {
    expect(applyFailureOf(problem({ code: 'OTHER_CODE' }))).toBeNull();
    expect(applyFailureOf(null)).toBeNull();
  });

  it.each([
    ['falha na linha 12', 12],
    ['failed at line #7', 7],
    ['error en la línea   # 3', 3],
    ['Linha#40', 40],
    ['sem número', null],
  ])('Dado o detalhe %j, então a posição é %j', (detail, position) => {
    expect(applyFailureOf(problem({ detail }))?.position).toBe(position);
  });

  it('Dado 10 000 espaços sem número, então termina em menos de 50 ms', () => {
    const detail = `linha${' '.repeat(10_000)}x`;

    expect(applyFailureOf(problem({ detail }))?.position).toBeNull();
    expect(fastestMs(() => applyFailureOf(problem({ detail })))).toBeLessThan(50);
  });
});
