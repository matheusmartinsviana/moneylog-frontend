import { computed, DestroyRef, effect, inject, Injectable, signal } from '@angular/core';
import { Title } from '@angular/platform-browser';

import { I18nService } from '~/app/common/i18n/i18n.service';
import { interpolate } from '~/app/common/i18n/interpolate';

export type PomodoroMode = 'focus' | 'shortBreak' | 'longBreak';

export const POMODORO_MODES: readonly PomodoroMode[] = ['focus', 'shortBreak', 'longBreak'];
export const POMODORO_SECONDS: Record<PomodoroMode, number> = {
  focus: 25 * 60,
  shortBreak: 5 * 60,
  longBreak: 15 * 60,
};
export const POMODORO_STORAGE_KEY = 'moneylog.pomodoro';
export const POMODORO_SET_SIZE = 4;

const SEGMENTS = {
  a: '8,5 13,0 47,0 52,5 47,10 13,10',
  b: '55,8 60,13 60,43 55,48 50,43 50,13',
  c: '55,52 60,57 60,87 55,92 50,87 50,57',
  d: '8,95 13,90 47,90 52,95 47,100 13,100',
  e: '5,52 10,57 10,87 5,92 0,87 0,57',
  f: '5,8 10,13 10,43 5,48 0,43 0,13',
  g: '8,50 13,45 47,45 52,50 47,55 13,55',
} as const;

type SegmentName = keyof typeof SEGMENTS;

const SEGMENT_NAMES = Object.keys(SEGMENTS) as readonly SegmentName[];

const DIGIT_SEGMENTS: readonly string[] = [
  'abcdef',
  'bc',
  'abged',
  'abgcd',
  'fgbc',
  'afgcd',
  'afgedc',
  'abc',
  'abcdefg',
  'abcdfg',
];

export interface PomodoroSegment {
  readonly name: SegmentName;
  readonly points: string;
  readonly lit: boolean;
}

interface Stored {
  readonly mode: PomodoroMode;
  readonly endAt: number | null;
  readonly day: string;
  readonly cycles: number;
}

function dayKey(now: number): string {
  const date = new Date(now);
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
}

function isMode(value: unknown): value is PomodoroMode {
  return value === 'focus' || value === 'shortBreak' || value === 'longBreak';
}

@Injectable({ providedIn: 'root' })
export class PomodoroService {
  private readonly title = inject(Title);
  private readonly t = inject(I18nService).t;

  readonly modes = POMODORO_MODES;
  readonly dots = Array.from({ length: POMODORO_SET_SIZE }, (_, index) => index);
  readonly mode = signal<PomodoroMode>('focus');
  readonly running = signal(false);
  readonly remaining = signal(POMODORO_SECONDS.focus);
  readonly cycles = signal(0);
  readonly announcement = signal('');
  readonly flash = signal(false);
  readonly focusOpen = signal(false);

  private endAt: number | null = null;
  private ticker: ReturnType<typeof setInterval> | null = null;
  private day = dayKey(Date.now());
  private readonly originalTitle = this.title.getTitle();

  readonly phrase = computed(() => {
    const copy = this.t().home.pomodoro;
    if (this.flash()) return copy.phraseDone;
    const mode = this.mode();
    if (mode === 'focus') return copy.phraseFocus;
    return mode === 'shortBreak' ? copy.phraseShortBreak : copy.phraseLongBreak;
  });

  readonly minutes = computed(() => Math.floor(this.remaining() / 60));
  readonly seconds = computed(() => this.remaining() % 60);
  readonly clock = computed(() => this.format(this.remaining()));

  readonly digits = computed(() => {
    const value = this.clock().replace(':', '');
    return [...value].map((char) => this.segmentsOf(Number(char)));
  });

  readonly timerLabel = computed(() => {
    const copy = this.t().home.pomodoro;
    const minutes = this.minutes();
    const seconds = this.seconds();
    return interpolate(copy.timerLabel, {
      minutes: interpolate(minutes === 1 ? copy.minute : copy.minutes, { count: String(minutes) }),
      seconds: interpolate(seconds === 1 ? copy.second : copy.seconds, { count: String(seconds) }),
    });
  });

  readonly cyclesLabel = computed(() =>
    interpolate(this.t().home.pomodoro.cycles, { count: String(this.cycles()) }),
  );

  readonly filledDots = computed(() => {
    const count = this.cycles();
    return count > 0 && count % POMODORO_SET_SIZE === 0
      ? POMODORO_SET_SIZE
      : count % POMODORO_SET_SIZE;
  });

  readonly mainLabel = computed(() => {
    const copy = this.t().home.pomodoro;
    if (this.running()) return copy.pause;
    return this.remaining() < POMODORO_SECONDS[this.mode()] ? copy.resume : copy.start;
  });

  constructor() {
    this.restore();
    let owned = false;
    effect(() => {
      const active = this.focusOpen() || this.running();
      const clock = this.clock();
      if (active) {
        owned = true;
        this.title.setTitle(clock);
      } else if (owned) {
        owned = false;
        this.title.setTitle(this.originalTitle);
      }
    });
    inject(DestroyRef).onDestroy(() => {
      this.clearTicker();
      this.title.setTitle(this.originalTitle);
    });
  }

  modeLabel(mode: PomodoroMode): string {
    return this.t().home.pomodoro[mode];
  }

  selectMode(mode: PomodoroMode): void {
    this.halt();
    this.mode.set(mode);
    this.remaining.set(POMODORO_SECONDS[mode]);
    this.flash.set(false);
    this.persist();
  }

  toggle(): void {
    if (this.running()) {
      this.halt();
      this.persist();
      return;
    }
    this.flash.set(false);
    this.announcement.set('');
    this.begin(this.remaining() * 1000);
  }

  stop(): void {
    this.halt();
    this.remaining.set(POMODORO_SECONDS[this.mode()]);
    this.flash.set(false);
    this.persist();
  }

  private begin(durationMs: number): void {
    this.endAt = Date.now() + durationMs;
    this.running.set(true);
    this.clearTicker();
    this.ticker = setInterval(() => this.tick(), 250);
    this.tick();
    this.persist();
  }

  private halt(): void {
    if (this.running()) this.sync();
    this.running.set(false);
    this.endAt = null;
    this.clearTicker();
    this.title.setTitle(this.originalTitle);
  }

  private tick(): void {
    this.sync();
    if (this.endAt !== null && this.endAt - Date.now() <= 0) {
      this.complete();
      return;
    }
    this.title.setTitle(this.clock());
  }

  private sync(): void {
    if (this.endAt === null) return;
    this.remaining.set(Math.max(0, Math.ceil((this.endAt - Date.now()) / 1000)));
  }

  private complete(): void {
    const finished = this.mode();
    this.running.set(false);
    this.endAt = null;
    this.clearTicker();
    this.title.setTitle(this.originalTitle);
    this.rollDay();
    if (finished === 'focus') this.cycles.update((count) => count + 1);
    const next: PomodoroMode =
      finished !== 'focus'
        ? 'focus'
        : this.cycles() % POMODORO_SET_SIZE === 0
          ? 'longBreak'
          : 'shortBreak';
    this.mode.set(next);
    this.remaining.set(POMODORO_SECONDS[next]);
    this.flash.set(true);
    this.announcement.set(
      interpolate(this.t().home.pomodoro.finished, { mode: this.modeLabel(next) }),
    );
    if (finished === 'focus') this.begin(POMODORO_SECONDS[next] * 1000);
    else this.persist();
  }

  private rollDay(): void {
    const today = dayKey(Date.now());
    if (today === this.day) return;
    this.day = today;
    this.cycles.set(0);
  }

  private clearTicker(): void {
    if (this.ticker !== null) clearInterval(this.ticker);
    this.ticker = null;
  }

  private format(totalSeconds: number): string {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }

  private segmentsOf(digit: number): readonly PomodoroSegment[] {
    const lit = DIGIT_SEGMENTS[digit] ?? '';
    return SEGMENT_NAMES.map((name) => ({
      name,
      points: SEGMENTS[name],
      lit: lit.includes(name),
    }));
  }

  private persist(): void {
    const stored: Stored = {
      mode: this.mode(),
      endAt: this.endAt,
      day: this.day,
      cycles: this.cycles(),
    };
    try {
      localStorage.setItem(POMODORO_STORAGE_KEY, JSON.stringify(stored));
    } catch {
      return;
    }
  }

  private restore(): void {
    let stored: Partial<Stored> | null;
    try {
      const raw = localStorage.getItem(POMODORO_STORAGE_KEY);
      stored = raw ? (JSON.parse(raw) as Partial<Stored>) : null;
    } catch {
      stored = null;
    }
    if (!stored) return;
    const now = Date.now();
    if (stored.day === dayKey(now) && Number.isInteger(stored.cycles) && stored.cycles! >= 0) {
      this.cycles.set(stored.cycles as number);
    }
    if (!isMode(stored.mode)) return;
    this.mode.set(stored.mode);
    this.remaining.set(POMODORO_SECONDS[stored.mode]);
    if (typeof stored.endAt !== 'number') return;
    if (stored.endAt > now) {
      this.begin(stored.endAt - now);
      return;
    }
    this.endAt = stored.endAt;
    this.complete();
  }
}
