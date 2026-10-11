import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  signal,
  untracked,
} from '@angular/core';

import { IconComponent } from '~/app/common/components/icon/icon.component';
import { I18nService } from '~/app/common/i18n/i18n.service';
import { interpolate } from '~/app/common/i18n/interpolate';
import { GoalPhotoComponent } from '~/app/features/goals/components/goal-photo/goal-photo.component';
import type { GoalPhoto } from '~/modules/goals/core/types/goal';

@Component({
  selector: 'app-goal-gallery',
  imports: [GoalPhotoComponent, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './goal-gallery.component.html',
  styleUrl: './goal-gallery.component.css',
})
export class GoalGalleryComponent {
  protected readonly t = inject(I18nService).t;

  readonly goalId = input.required<string>();
  readonly goalName = input.required<string>();
  readonly photos = input.required<readonly GoalPhoto[]>();

  protected readonly index = signal(0);
  protected readonly navigated = signal(false);
  protected readonly current = computed(() => this.photos()[this.index()] ?? null);
  protected readonly multiple = computed(() => this.photos().length > 1);
  protected readonly label = computed(() =>
    interpolate(this.t().goals.photos.gallery.label, { name: this.goalName() }),
  );
  protected readonly currentAlt = computed(() => this.altOf(this.index()));

  constructor() {
    effect(() => {
      const total = this.photos().length;
      untracked(() => {
        if (this.index() >= total) this.index.set(Math.max(0, total - 1));
      });
    });
    effect(() => {
      this.goalId();
      untracked(() => {
        this.index.set(0);
        this.navigated.set(false);
      });
    });
  }

  protected altOf(position: number): string {
    return interpolate(this.t().goals.photos.alt, {
      n: String(position + 1),
      total: String(this.photos().length),
      name: this.goalName(),
    });
  }

  protected showLabel(position: number): string {
    return interpolate(this.t().goals.photos.gallery.show, { n: String(position + 1) });
  }

  protected go(position: number): void {
    const total = this.photos().length;
    if (total === 0) return;
    this.navigated.set(true);
    this.index.set(((position % total) + total) % total);
  }

  protected step(delta: -1 | 1): void {
    this.go(this.index() + delta);
  }

  protected onKey(event: KeyboardEvent): void {
    if (event.altKey || event.ctrlKey || event.metaKey || !this.multiple()) return;
    switch (event.key) {
      case 'ArrowLeft':
        this.step(-1);
        break;
      case 'ArrowRight':
        this.step(1);
        break;
      case 'Home':
        this.go(0);
        break;
      case 'End':
        this.go(this.photos().length - 1);
        break;
      default:
        return;
    }
    event.preventDefault();
  }
}
