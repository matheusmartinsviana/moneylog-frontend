import { isPlatformBrowser } from '@angular/common';
import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  ElementRef,
  inject,
  input,
  PLATFORM_ID,
  signal,
} from '@angular/core';

import { I18nService } from '~/app/common/i18n/i18n.service';
import { MoneyPipe } from '~/app/common/pipes/money.pipe';
import { ValuesVisibilityService } from '~/app/common/services/values-visibility.service';
import { formatMoney, maskedMoney, Money } from '~/util/money';

const COUNT_DURATION_MS = 1000;
const DECIMAL = /^-?\d+(?:\.(\d+))?$/;

type CountPhase = 'idle' | 'running' | 'done';

function easeOut(progress: number): number {
  return 1 - Math.pow(1 - progress, 3);
}

function interpolate(money: Money, progress: number): Money {
  const match = DECIMAL.exec(money.amount);
  if (!match) return money;
  const digits = match[1]?.length ?? 0;
  const scale = Math.pow(10, digits);
  const units = Math.round(Math.abs(Number(money.amount)) * scale);
  const current = Math.round(units * progress);
  const sign = money.amount.startsWith('-') && current > 0 ? '-' : '';
  const text = String(current).padStart(digits + 1, '0');
  const whole = digits ? text.slice(0, -digits) : text;
  const fraction = digits ? `.${text.slice(-digits)}` : '';
  return { amount: `${sign}${whole}${fraction}`, currency: money.currency };
}

@Component({
  selector: 'app-money',
  imports: [MoneyPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (masked()) {
      <span class="num money" data-cy="money-value" data-masked="true">
        <span aria-hidden="true">{{ mask() }}</span>
        <span class="visually-hidden">{{ t().glass.values.hidden }}</span>
      </span>
    } @else if (counting()) {
      <span class="num money money--counting" data-cy="money-value" data-counting="true">
        <span class="money__sizer" aria-hidden="true">{{ value() | money }}</span>
        <span class="money__live" aria-hidden="true">{{ counted() }}</span>
        <span class="visually-hidden">{{ value() | money }}</span>
      </span>
    } @else {
      <span class="num money" data-cy="money-value">{{ value() | money }}</span>
    }
  `,
  styles: `
    :host {
      display: inline;
    }

    .money {
      font-variant-numeric: tabular-nums;
      font-feature-settings: 'tnum';
      white-space: nowrap;
    }

    .money--counting {
      display: inline-grid;
      justify-items: end;
    }

    .money__sizer,
    .money__live {
      grid-area: 1 / 1;
    }

    .money__sizer {
      visibility: hidden;
    }
  `,
})
export class MoneyComponent {
  private readonly visibility = inject(ValuesVisibilityService);
  private readonly i18n = inject(I18nService);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly destroyRef = inject(DestroyRef);
  private readonly browser = isPlatformBrowser(inject(PLATFORM_ID));

  readonly value = input.required<Money>();
  readonly maskable = input(false);
  readonly animate = input(false);

  protected readonly t = this.i18n.t;
  protected readonly masked = computed(() => this.maskable() && this.visibility.hidden());
  protected readonly mask = computed(() => maskedMoney(this.value().currency));

  private readonly phase = signal<CountPhase>('idle');
  private readonly progress = signal(0);
  private readonly eligible = this.browser && this.canAnimate();

  protected readonly counting = computed(
    () => this.animate() && this.eligible && this.phase() !== 'done',
  );
  protected readonly counted = computed(() =>
    formatMoney(interpolate(this.value(), this.progress())),
  );

  constructor() {
    afterNextRender(() => {
      if (!this.animate() || !this.eligible) return;
      if (this.masked()) {
        this.phase.set('done');
        return;
      }
      this.observeEntry();
    });
  }

  private canAnimate(): boolean {
    return (
      typeof IntersectionObserver !== 'undefined' &&
      typeof requestAnimationFrame !== 'undefined' &&
      !(typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches)
    );
  }

  private observeEntry(): void {
    let frame = 0;
    const observer = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      observer.disconnect();
      if (this.masked()) {
        this.phase.set('done');
        return;
      }
      this.run((id) => (frame = id));
    });
    observer.observe(this.host.nativeElement);
    this.destroyRef.onDestroy(() => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    });
  }

  private run(track: (id: number) => void): void {
    this.phase.set('running');
    const startedAt = performance.now();
    const step = (now: number): void => {
      if (this.masked()) {
        this.phase.set('done');
        return;
      }
      const ratio = Math.min((now - startedAt) / COUNT_DURATION_MS, 1);
      this.progress.set(easeOut(ratio));
      if (ratio < 1) track(requestAnimationFrame(step));
      else this.phase.set('done');
    };
    track(requestAnimationFrame(step));
  }
}
