import { MoneyPipe } from '~/app/common/pipes/money.pipe';

describe('MoneyPipe', () => {
  const pipe = new MoneyPipe();

  const brl = { amount: '1234.56', currency: 'BRL' };

  it('Dado um Money, quando transformo, então formata pela moeda do dado', () => {
    expect(pipe.transform(brl).replace(/\u00a0/g, ' ')).toBe('R$ 1.234,56');
  });

  it('Dado nulo ou indefinido, então devolve texto vazio', () => {
    expect(pipe.transform(null)).toBe('');
    expect(pipe.transform(undefined)).toBe('');
  });

  it('Dado um Money, então o pipe só formata e nunca mascara', () => {
    expect(pipe.transform(brl)).not.toContain('•');
  });
});
