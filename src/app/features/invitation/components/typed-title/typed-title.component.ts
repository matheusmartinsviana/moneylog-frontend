import { DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  input,
  OnInit,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { concat, concatMap, from, tap, timer } from 'rxjs';

import { motionEnabled } from '~/app/common/motion/motion';
import {
  buildTypingDelays,
  TYPING_RANDOM,
} from '~/app/features/invitation/components/typed-title/typing-schedule';

export const CURSOR_LINGER_MS = 3200;

@Component({
  selector: 'app-typed-title',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './typed-title.component.html',
  styleUrl: './typed-title.component.css',
})
export class TypedTitleComponent implements OnInit {
  private readonly document = inject(DOCUMENT);
  private readonly destroyRef = inject(DestroyRef);
  private readonly random = inject(TYPING_RANDOM);

  readonly text = input.required<string>();
  readonly hesitateAt = input<number | null>(null);

  private readonly typedCount = signal(0);
  private readonly finished = signal(false);
  private readonly animated = signal(false);
  protected readonly cursorVisible = signal(false);

  private readonly characters = computed(() => [...this.text()]);
  protected readonly typed = computed(() =>
    this.finished() ? this.text() : this.characters().slice(0, this.typedCount()).join(''),
  );
  protected readonly rest = computed(() =>
    this.finished() ? '' : this.characters().slice(this.typedCount()).join(''),
  );
  protected readonly typing = computed(() => this.animated() && !this.finished());

  ngOnInit(): void {
    if (!motionEnabled(this.document)) {
      this.finished.set(true);
      return;
    }
    this.animated.set(true);
    this.cursorVisible.set(true);
    const delays = buildTypingDelays(this.text(), this.random, this.hesitateAt());
    concat(
      from(delays).pipe(
        concatMap((delay) => timer(delay)),
        tap(() => this.typedCount.update((count) => count + 1)),
      ),
      timer(0).pipe(tap(() => this.finished.set(true))),
      timer(CURSOR_LINGER_MS).pipe(tap(() => this.cursorVisible.set(false))),
    )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe();
  }
}
