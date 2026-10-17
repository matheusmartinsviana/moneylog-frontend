import {
  bpsToPercentText,
  formatBps,
  formatPoints,
  formatRatio,
  percentTextToBps,
  ratioForBar,
  ratioMagnitude,
  ratioSign,
} from '~/util/ratio';

describe('ratio', () => {
  it('Dado 0.4250 em pt-BR, então formata 42,5% sem calcular no front', () => {
    expect(formatRatio('0.4250', 'pt-BR')).toBe('42,5%');
  });

  it('Dado en, então usa o ponto decimal', () => {
    expect(formatRatio('0.9167', 'en')).toBe('91.7%');
  });

  it('Dado razão acima de 1, então não limita (a meta pode passar do alvo)', () => {
    expect(formatRatio('1.2500', 'pt-BR')).toBe('125%');
  });

  it('Dado signed, então traz + e o menos tipográfico, e zero sem sinal', () => {
    expect(formatRatio('0.6667', 'pt-BR', { signed: true })).toBe('+66,7%');
    expect(formatRatio('-0.0351', 'pt-BR', { signed: true })).toBe('−3,5%');
    expect(formatRatio('0.0000', 'pt-BR', { signed: true })).toBe('0%');
  });

  it('Dado texto que não é razão, então volta como veio', () => {
    expect(formatRatio('abc', 'pt-BR')).toBe('abc');
    expect(ratioForBar('abc')).toBeNull();
    expect(ratioSign('abc')).toBe('flat');
  });

  it('Dado a razão para a barra, então só converte o texto', () => {
    expect(ratioForBar('0.4250')).toBe(0.425);
  });

  it('Dado o sinal, então lê só o texto', () => {
    expect(ratioSign('0.1000')).toBe('up');
    expect(ratioSign('-0.1000')).toBe('down');
    expect(ratioSign('0.0000')).toBe('flat');
    expect(ratioSign('-0.0000')).toBe('flat');
  });

  it('Dado a razão assinada, então a magnitude é só o texto sem o sinal', () => {
    expect(ratioMagnitude('-0.0420')).toBe('0.0420');
    expect(ratioMagnitude('0.1800')).toBe('0.1800');
    expect(ratioMagnitude('abc')).toBe('abc');
  });

  it('Dado a diferença em pontos percentuais, então formata sem o símbolo de percentual', () => {
    expect(formatPoints('0.0380', 'pt-BR', { signed: true })).toBe('+3,8');
    expect(formatPoints('-0.0333', 'pt-BR', { signed: true })).toBe('−3,3');
    expect(formatPoints('-0.0333', 'es', { signed: true })).toBe('−3,3');
    expect(formatPoints('0.0380', 'en', { signed: true })).toBe('+3.8');
    expect(formatPoints('0.0000', 'pt-BR', { signed: true })).toBe('0');
    expect(formatPoints('abc', 'pt-BR')).toBe('abc');
  });
});

describe('pontos-base', () => {
  it('Dado 350 em pt-BR, então formata 3,5%', () => {
    expect(formatBps(350, 'pt-BR')).toBe('3,5%');
  });

  it('Dado 705 pontos-base, então o texto do campo é 7.05', () => {
    expect(bpsToPercentText(705)).toBe('7.05');
    expect(bpsToPercentText(700)).toBe('7');
    expect(bpsToPercentText(750)).toBe('7.5');
  });

  it('Dado "7,5" ou "7.05", então converte para pontos-base sem float', () => {
    expect(percentTextToBps('7,5')).toBe(750);
    expect(percentTextToBps('7.05')).toBe(705);
    expect(percentTextToBps('100')).toBe(10000);
  });

  it('Dado texto inválido ou acima de 100%, então devolve null', () => {
    expect(percentTextToBps('abc')).toBeNull();
    expect(percentTextToBps('100.01')).toBeNull();
    expect(percentTextToBps('')).toBeNull();
  });
});
