import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  input,
  output,
  signal,
  untracked,
} from '@angular/core';
import { RouterLink } from '@angular/router';

import { MoneyComponent } from '~/app/common/components/money/money.component';
import { ProgressBarComponent } from '~/app/common/components/progress-bar/progress-bar.component';
import { HTML_LANG } from '~/app/common/i18n/i18n';
import { I18nService } from '~/app/common/i18n/i18n.service';
import { interpolate } from '~/app/common/i18n/interpolate';
import { GoalPhotoComponent } from '~/app/features/goals/components/goal-photo/goal-photo.component';
import { goalName } from '~/app/features/goals/services/goal-name';
import { GoalPhotoImageFacade } from '~/modules/goals/core/facades/goal-photo-image.facade';
import type { Goal } from '~/modules/goals/core/types/goal';
import { formatRatio, ratioForBar } from '~/util/ratio';

export type FeaturedGoalStatus = 'loading' | 'ready' | 'error';

export const SLIDER_INTERVAL_MS = 5000;

@Component({
  selector: 'app-featured-goal',
  imports: [RouterLink, ProgressBarComponent, GoalPhotoComponent, MoneyComponent],
  providers: [GoalPhotoImageFacade],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(document:visibilitychange)': 'onVisibility()' },
  templateUrl: './featured-goal.component.html',
  styleUrl: './featured-goal.component.css',
})
export class FeaturedGoalComponent {
  private readonly i18n = inject(I18nService);
  private readonly images = inject(GoalPhotoImageFacade);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly t = this.i18n.t;

  readonly goals = input.required<readonly Goal[]>();
  readonly status = input<FeaturedGoalStatus>('ready');
  readonly retry = output<void>();

  protected readonly index = signal(0);
  protected readonly userPaused = signal(false);
  protected readonly hovering = signal(false);
  protected readonly focused = signal(false);
  protected readonly touching = signal(false);
  private readonly tabVisible = signal(true);
  protected readonly reducedMotion = signal(false);

  private readonly goal = computed(() => this.goals()[0] ?? null);
  protected readonly photos = computed(() => this.goal()?.photos ?? []);
  protected readonly multiple = computed(() => this.photos().length > 1);
  protected readonly position = computed(() =>
    Math.min(this.index(), Math.max(0, this.photos().length - 1)),
  );
  protected readonly current = computed(() => this.photos()[this.position()] ?? null);

  protected readonly playing = computed(
    () =>
      this.multiple() &&
      !this.reducedMotion() &&
      !this.userPaused() &&
      !this.hovering() &&
      !this.focused() &&
      !this.touching() &&
      this.tabVisible(),
  );
  protected readonly live = computed(() => (this.playing() ? 'off' : 'polite'));

  protected readonly view = computed(() => {
    const goal = this.goal();
    if (!goal) return null;
    const name = goalName(goal, this.t().goals);
    const bar = ratioForBar(goal.progress);
    return {
      id: goal.id,
      name,
      stage: goal.stage,
      target: goal.target,
      bar: bar === null ? null : Math.min(1, Math.max(0, bar)),
      percent: formatRatio(goal.progress, HTML_LANG[this.i18n.language()]),
      openLabel: interpolate(this.t().brief.featuredGoal.open, { name }),
      photosLabel: interpolate(this.t().brief.featuredGoal.photosLabel, { name }),
    };
  });

  constructor() {
    if (typeof matchMedia === 'function') {
      const query = matchMedia('(prefers-reduced-motion: reduce)');
      this.reducedMotion.set(query.matches);
      const onChange = (event: MediaQueryListEvent) => this.reducedMotion.set(event.matches);
      query.addEventListener('change', onChange);
      this.destroyRef.onDestroy(() => query.removeEventListener('change', onChange));
    }

    effect((onCleanup) => {
      if (!this.playing()) return;
      this.position();
      const timer = setTimeout(() => this.go(this.position() + 1), SLIDER_INTERVAL_MS);
      onCleanup(() => clearTimeout(timer));
    });

    effect(() => {
      const goal = this.goal();
      const photos = this.photos();
      if (!goal || photos.length < 2) return;
      const next = photos[(this.position() + 1) % photos.length];
      if (next) untracked(() => this.images.preload(goal.id, next.id, 'display'));
    });

    effect(() => {
      const id = this.goal()?.id;
      untracked(() => {
        if (id !== undefined) this.index.set(0);
      });
    });
  }

  protected onVisibility(): void {
    this.tabVisible.set(document.visibilityState !== 'hidden');
  }

  protected go(position: number): void {
    const total = this.photos().length;
    if (total === 0) return;
    this.index.set(((position % total) + total) % total);
  }

  protected step(delta: -1 | 1): void {
    this.go(this.position() + delta);
  }

  protected togglePlay(): void {
    this.userPaused.update((paused) => !paused);
  }

  protected onFocusOut(event: FocusEvent, host: HTMLElement): void {
    if (!host.contains(event.relatedTarget as Node | null)) this.focused.set(false);
  }

  protected altOf(position: number): string {
    return interpolate(this.t().goals.photos.alt, {
      n: String(position + 1),
      total: String(this.photos().length),
      name: this.view()?.name ?? '',
    });
  }

  protected goToLabel(position: number): string {
    return interpolate(this.t().brief.featuredGoal.goTo, {
      n: String(position + 1),
      total: String(this.photos().length),
    });
  }
}
