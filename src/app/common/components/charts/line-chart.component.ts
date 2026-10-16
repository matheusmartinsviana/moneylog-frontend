import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  input,
  signal,
} from '@angular/core';

import { areaPath, curvePath, type Point } from '~/app/common/components/charts/chart-geometry';
import { revealOnEnter } from '~/app/common/components/charts/reveal';
import { LiveAnnouncer } from '~/app/common/components/overlay/live-announcer.service';
import { I18nService } from '~/app/common/i18n/i18n.service';
import { interpolate } from '~/app/common/i18n/interpolate';
import { ValuesVisibilityService } from '~/app/common/services/values-visibility.service';
import { formatMoney, maskedMoney, type Money } from '~/util/money';

export interface LineChartSeries {
  readonly id: string;
  readonly label: string;
  readonly tone: 'primary' | 'secondary';
  readonly values: readonly Money[];
  readonly area?: boolean;
}

export interface LineChartKey {
  readonly id: string;
  readonly label: string;
  readonly shortLabel?: string;
}

const W = 1000;
const H = 300;
const PAD_X = 16;
const PAD_TOP = 34;
const PAD_BOTTOM = 10;
const MAX_POINTS = 400;
const MAX_MARKED_POINTS = 31;
let nextId = 0;

interface Drawn {
  readonly series: LineChartSeries;
  readonly line: string;
  readonly area: string;
  readonly dots: readonly { readonly leftPct: number; readonly topPct: number }[];
}

@Component({
  selector: 'app-line-chart',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.compact]': 'compact()',
    '[class.area]': "variant() === 'area'",
    '(document:pointerdown)': 'onDocumentPointerDown($event)',
  },
  templateUrl: './line-chart.component.html',
  styleUrls: [
    './line-chart.component.css',
    './line-chart-detail.component.css',
    './line-chart-area.component.css',
  ],
})
export class LineChartComponent {
  private readonly announcer = inject(LiveAnnouncer);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly visibility = inject(ValuesVisibilityService);
  protected readonly t = inject(I18nService).t;

  readonly label = input.required<string>();
  readonly series = input.required<readonly LineChartSeries[]>();
  readonly keys = input.required<readonly LineChartKey[]>();
  readonly cy = input('line-chart');
  readonly compact = input(false, { transform: booleanAttribute });
  readonly maskable = input(false, { transform: booleanAttribute });
  readonly markers = input(false, { transform: booleanAttribute });
  readonly variant = input<'line' | 'area'>('line');
  readonly summaryText = input<string | null>(null);
  readonly emptyText = input<string | null>(null);

  protected readonly uid = ++nextId;
  protected readonly fillId = `line-chart-fill-${this.uid}`;
  protected readonly tableId = `line-chart-table-${this.uid}`;
  protected readonly hintId = `line-chart-hint-${this.uid}`;
  protected readonly width = W;
  protected readonly height = H;

  protected readonly active = signal<number | null>(null);
  protected readonly tableOpen = signal(false);
  protected readonly pending = revealOnEnter();

  protected readonly count = computed(() => {
    const lengths = this.series().map((s) => s.values.length);
    return Math.min(this.keys().length, MAX_POINTS, ...(lengths.length ? lengths : [0]));
  });

  private readonly nums = computed(() =>
    this.series().map((s) =>
      s.values.slice(0, this.count()).map((v) => {
        const n = Number(v.amount);
        return Number.isFinite(n) ? n : 0;
      }),
    ),
  );

  private readonly money = computed(() => {
    const masked = this.maskable() && this.visibility.hidden();
    return (value: Money): string => (masked ? maskedMoney(value.currency) : formatMoney(value));
  });

  protected readonly empty = computed(
    () => this.count() === 0 || this.nums().every((values) => values.every((n) => n === 0)),
  );

  private readonly domain = computed(() => {
    const all = this.nums().flat();
    return { min: Math.min(0, ...all), max: Math.max(0, ...all) };
  });

  private readonly y = computed(() => {
    const { min, max } = this.domain();
    const span = max - min || 1;
    return (value: number): number => PAD_TOP + ((max - value) / span) * (H - PAD_TOP - PAD_BOTTOM);
  });

  private readonly x = computed(() => {
    const n = this.count();
    return (index: number): number =>
      n <= 1 ? W / 2 : PAD_X + (index * (W - PAD_X * 2)) / (n - 1);
  });

  protected readonly drawn = computed<readonly Drawn[]>(() => {
    const x = this.x();
    const y = this.y();
    const baseline = y(0);
    return this.series().map((series, s) => {
      const points: Point[] = this.nums()[s]!.map((value, i) => ({ x: x(i), y: y(value) }));
      return {
        series,
        line: points.length > 1 ? curvePath(points) : '',
        area: (series.area ?? series.tone === 'primary') ? areaPath(points, baseline) : '',
        dots: points.map((p) => ({ leftPct: (p.x / W) * 100, topPct: (p.y / H) * 100 })),
      };
    });
  });

  protected readonly gridY = computed(() => {
    const { min, max } = this.domain();
    const y = this.y();
    const third = min < 0 ? y(min) : y(max / 2);
    return [...new Set([y(max), y(0), third].map((v) => Math.round(v * 100) / 100))];
  });

  protected readonly marked = computed(() => {
    if (this.variant() === 'area' || !this.markers() || this.count() > MAX_MARKED_POINTS) return [];
    return this.drawn().map((item) => ({
      id: item.series.id,
      secondary: item.series.tone === 'secondary',
      dots: item.dots,
    }));
  });

  protected readonly directLabels = computed(() => {
    if (this.variant() === 'area' || !this.markers() || this.count() < 2) return [];
    const last = this.count() - 1;
    const lastValues = this.nums().map((values) => values[last] ?? 0);
    const top = lastValues.indexOf(Math.max(...lastValues));
    return this.drawn().map((item, s) => {
      return {
        id: item.series.id,
        text: item.series.label,
        secondary: item.series.tone === 'secondary',
        above: s === top,
        leftPct: item.dots[last]?.leftPct ?? 100,
        topPct: item.dots[last]?.topPct ?? 0,
      };
    });
  });

  protected readonly zeroTopPct = computed(() => (this.y()(0) / H) * 100);

  private extreme(kind: 'max' | 'min'): { n: number; money: Money } | null {
    let best: { n: number; money: Money } | null = null;
    this.series().forEach((s, si) => {
      this.nums()[si]!.forEach((n, i) => {
        const better = best === null || (kind === 'max' ? n > best.n : n < best.n);
        if (better) best = { n, money: s.values[i]! };
      });
    });
    return best;
  }

  protected readonly maxLabel = computed(() => {
    const found = this.extreme('max');
    return found !== null && found.n > 0
      ? { text: this.money()(found.money), topPct: (this.y()(this.domain().max) / H) * 100 }
      : null;
  });

  protected readonly minLabel = computed(() => {
    const found = this.extreme('min');
    return found !== null && found.n < 0
      ? { text: this.money()(found.money), topPct: (this.y()(this.domain().min) / H) * 100 }
      : null;
  });

  protected readonly axisLabels = computed(() => {
    const n = this.count();
    if (n === 0) return [];
    const max = this.compact() ? 3 : 4;
    const picks =
      n <= max
        ? [...Array(n).keys()]
        : this.compact()
          ? [0, Math.round((n - 1) / 2), n - 1]
          : [0, Math.round((n - 1) / 3), Math.round(((n - 1) * 2) / 3), n - 1];
    const ticks = [...new Set(picks)];
    const positions = ticks.map((i) => (this.x()(i) / W) * 100);
    const gaps = positions.slice(1).map((p, i) => p - positions[i]!);
    const minGap = gaps.length > 0 ? Math.min(...gaps) : 100;
    const maxPct = Math.floor(ticks.length === 2 ? minGap / 2 : (minGap * 2) / 3);
    return ticks.map((i) => {
      const key = this.keys()[i]!;
      return {
        text: key.shortLabel ?? key.label,
        maxPct,
        leftPct: (this.x()(i) / W) * 100,
        edge: i === 0 ? 'start' : i === n - 1 ? 'end' : 'mid',
      };
    });
  });

  protected readonly summary = computed(
    () =>
      this.summaryText() ??
      interpolate(this.t().charts.summary, {
        label: this.label(),
        series: this.series()
          .map((s) => s.label)
          .join(', '),
        points: String(this.count()),
      }),
  );

  protected readonly rows = computed(() =>
    this.keys()
      .slice(0, this.count())
      .map((key, i) => ({
        label: key.label,
        cells: this.series().map((s) => this.money()(s.values[i]!)),
      })),
  );

  protected readonly tip = computed(() => {
    const i = this.active();
    if (i === null || i >= this.count()) return null;
    const leftPct = (this.x()(i) / W) * 100;
    return {
      index: i,
      label: this.keys()[i]!.label,
      leftPct,
      flip: leftPct > 50,
      rows: this.series().map((s, si) => ({
        id: s.id,
        label: s.label,
        tone: s.tone,
        value: this.money()(s.values[i]!),
        topPct: (this.y()(this.nums()[si]![i]!) / H) * 100,
      })),
    };
  });

  protected toggleTable(): void {
    this.tableOpen.update((open) => !open);
  }

  private indexAt(event: PointerEvent): number {
    const el = event.currentTarget as HTMLElement;
    const rect = el.getBoundingClientRect();
    const n = this.count();
    if (n <= 1 || rect.width === 0) return 0;
    const inner = ((event.clientX - rect.left) / rect.width) * W;
    const index = Math.round(((inner - PAD_X) / (W - PAD_X * 2)) * (n - 1));
    return Math.min(n - 1, Math.max(0, index));
  }

  protected onPointer(event: PointerEvent): void {
    if (this.empty()) return;
    this.active.set(this.indexAt(event));
  }

  protected onPointerCancel(): void {
    this.active.set(null);
  }

  protected onDocumentPointerDown(event: PointerEvent): void {
    if (this.active() === null) return;
    const plot = this.host.nativeElement.querySelector('.lc__plot');
    if (!(event.target instanceof Node) || !plot?.contains(event.target)) this.active.set(null);
  }

  protected onPointerLeave(event: PointerEvent): void {
    if (event.pointerType === 'mouse') this.active.set(null);
  }

  protected onKeydown(event: KeyboardEvent): void {
    const n = this.count();
    if (this.empty() || n === 0) return;
    const current = this.active();
    let next: number | null;
    switch (event.key) {
      case 'ArrowRight':
        next = current === null ? 0 : Math.min(n - 1, current + 1);
        break;
      case 'ArrowLeft':
        next = current === null ? n - 1 : Math.max(0, current - 1);
        break;
      case 'Home':
        next = 0;
        break;
      case 'End':
        next = n - 1;
        break;
      case 'Escape':
        if (current === null) return;
        event.preventDefault();
        this.active.set(null);
        return;
      default:
        return;
    }
    event.preventDefault();
    this.active.set(next);
    const tip = this.tip();
    if (tip) {
      this.announcer.announce(
        `${tip.label}: ${tip.rows.map((row) => `${row.label} ${row.value}`).join(', ')}`,
      );
    }
  }

  protected onBlur(): void {
    this.active.set(null);
  }
}
