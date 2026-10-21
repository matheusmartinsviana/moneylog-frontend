import {
  buildTypingDelays,
  seededRandom,
  TYPING_BASE_MAX_MS,
  TYPING_BASE_MIN_MS,
  TYPING_HESITATION_MIN_MS,
  TYPING_PUNCTUATION_PAUSE_MIN_MS,
  TYPING_START_MS,
} from '~/app/features/invitation/components/typed-title/typing-schedule';

describe('buildTypingDelays', () => {
  it('Dado o mesmo seed, então a sequência é idêntica', () => {
    const a = buildTypingDelays('Você foi convidado', seededRandom(7));
    const b = buildTypingDelays('Você foi convidado', seededRandom(7));

    expect(a).toEqual(b);
    expect(a).toHaveLength(18);
  });

  it('Dado um texto, então a primeira letra espera o início e as demais variam entre o mínimo e o máximo', () => {
    const delays = buildTypingDelays('abcdefghij', seededRandom(3));

    expect(delays[0]).toBe(TYPING_START_MS);
    const rest = delays.slice(1);
    expect(rest.every((d) => d >= TYPING_BASE_MIN_MS && d <= TYPING_BASE_MAX_MS)).toBe(true);
    expect(new Set(rest).size).toBeGreaterThan(3);
  });

  it('Dado espaço e pontuação, então a letra seguinte espera mais', () => {
    const flat = () => 0;
    const delays = buildTypingDelays('ab c,d', flat);

    expect(delays[1]).toBe(TYPING_BASE_MIN_MS);
    expect(delays[3]).toBeGreaterThan(delays[1]!);
    expect(delays[5]).toBeGreaterThanOrEqual(TYPING_BASE_MIN_MS + TYPING_PUNCTUATION_PAUSE_MIN_MS);
  });

  it('Dado o índice de hesitação, então só a letra daquele índice ganha a pausa extra', () => {
    const flat = () => 0;
    const plain = buildTypingDelays('por Ana', flat);
    const hesitant = buildTypingDelays('por Ana', flat, 4);

    expect(hesitant[4]! - plain[4]!).toBe(TYPING_HESITATION_MIN_MS);
    expect(hesitant.filter((d, i) => d !== plain[i])).toHaveLength(1);
  });

  it('Dado texto vazio, então não há atrasos', () => {
    expect(buildTypingDelays('', seededRandom(1))).toEqual([]);
  });
});
