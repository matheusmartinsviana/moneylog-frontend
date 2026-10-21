import { InjectionToken } from '@angular/core';

export type RandomSource = () => number;

export const TYPING_RANDOM = new InjectionToken<RandomSource>('TYPING_RANDOM', {
  providedIn: 'root',
  factory: () => Math.random,
});

export const TYPING_START_MS = 450;
export const TYPING_BASE_MIN_MS = 45;
export const TYPING_BASE_MAX_MS = 110;
export const TYPING_SPACE_PAUSE_MIN_MS = 50;
export const TYPING_SPACE_PAUSE_MAX_MS = 110;
export const TYPING_PUNCTUATION_PAUSE_MIN_MS = 180;
export const TYPING_PUNCTUATION_PAUSE_MAX_MS = 320;
export const TYPING_HESITATION_MIN_MS = 320;
export const TYPING_HESITATION_MAX_MS = 520;

const PUNCTUATION = new Set([',', '.', ';', ':', '!', '?', '…']);

export function seededRandom(seed: number): RandomSource {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function between(random: RandomSource, min: number, max: number): number {
  return Math.round(min + random() * (max - min));
}

export function buildTypingDelays(
  text: string,
  random: RandomSource,
  hesitateAt: number | null = null,
): number[] {
  const chars = [...text];
  return chars.map((_, index) => {
    if (index === 0) return TYPING_START_MS;
    const previous = chars[index - 1] ?? '';
    let delay = between(random, TYPING_BASE_MIN_MS, TYPING_BASE_MAX_MS);
    if (previous === ' ') {
      delay += between(random, TYPING_SPACE_PAUSE_MIN_MS, TYPING_SPACE_PAUSE_MAX_MS);
    } else if (PUNCTUATION.has(previous)) {
      delay += between(random, TYPING_PUNCTUATION_PAUSE_MIN_MS, TYPING_PUNCTUATION_PAUSE_MAX_MS);
    }
    if (hesitateAt !== null && index === hesitateAt) {
      delay += between(random, TYPING_HESITATION_MIN_MS, TYPING_HESITATION_MAX_MS);
    }
    return delay;
  });
}
