import { commitmentUntil } from '~/modules/purchase-groups/core/types/purchase-group';

describe('commitmentUntil', () => {
  it('Dado hoje em outubro e 12 meses, então a competência final é outubro do ano seguinte', () => {
    expect(commitmentUntil('2026-10-15', 12)).toBe('2027-10');
  });

  it('Dado a virada do ano, então avança o ano', () => {
    expect(commitmentUntil('2026-11-30', 6)).toBe('2027-05');
  });
});
