import { fastestMs } from '~/testing/timing';
import { trimMatching } from '~/util/trim';

const dotsAndSpaces = (char: string) => /[.\s]/.test(char);

describe('trimMatching', () => {
  it.each([
    ['..a..', 'a'],
    [' . a b . ', 'a b'],
    ['a', 'a'],
    ['', ''],
    ['....', ''],
    ['a.b', 'a.b'],
  ])('Dado %j, então corta só as pontas e devolve %j', (input, expected) => {
    expect(trimMatching(input, dotsAndSpaces)).toBe(expected);
  });

  it('Dado 10 000 pontos seguidos e uma letra, então termina em menos de 50 ms', () => {
    const input = `${'.'.repeat(10_000)}a${'.'.repeat(10_000)}`;

    expect(trimMatching(input, dotsAndSpaces)).toBe('a');
    expect(fastestMs(() => trimMatching(input, dotsAndSpaces))).toBeLessThan(50);
  });
});
