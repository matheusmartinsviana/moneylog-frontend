import { sanitizeSharedText } from '~/app/features/quick-add/quick-add-params';
import { fastestMs } from '~/testing/timing';

describe('sanitizeSharedText (T137 CA2)', () => {
  it('Dado texto comum, então devolve o mesmo texto', () => {
    expect(sanitizeSharedText('almoço')).toBe('almoço');
  });

  it('Dado HTML, então tira a marcação (a tela nunca renderiza HTML)', () => {
    expect(sanitizeSharedText('<img src=x onerror=alert(1)>almoço<script>x</script>')).toBe(
      'almoço x',
    );
  });

  it('Dado controle e espaços, então normaliza', () => {
    expect(sanitizeSharedText('  a\u0000b\n\n  c ')).toBe('a b c');
  });

  it('Dado texto enorme, então corta em 200', () => {
    expect(sanitizeSharedText('x'.repeat(500))).toHaveLength(200);
  });

  it('Dado um < solto dentro de uma tag, então o regex antigo e o laço descartam até o primeiro >', () => {
    expect(sanitizeSharedText('<a<b> x')).toBe('x');
    expect(sanitizeSharedText('a <b c')).toBe('a <b c');
    expect(sanitizeSharedText('a<b>c<d>e')).toBe('a c e');
  });

  it('Dado 10 000 < sem >, então termina em menos de 50 ms e mantém o texto', () => {
    const input = '<'.repeat(10_000);

    expect(sanitizeSharedText(input)).toHaveLength(200);
    expect(fastestMs(() => sanitizeSharedText(input))).toBeLessThan(50);
  });

  it('Dado null, então vazio', () => {
    expect(sanitizeSharedText(null)).toBe('');
  });
});
