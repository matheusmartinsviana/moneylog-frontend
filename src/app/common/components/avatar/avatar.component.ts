import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';

import { IconComponent } from '~/app/common/components/icon/icon.component';

export type AvatarSize = 'sm' | 'md' | 'lg';

const ICON_SIZE: Readonly<Record<AvatarSize, number>> = { sm: 16, md: 20, lg: 40 };

@Component({
  selector: 'app-avatar',
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': '"avatar avatar--" + size()',
    '[attr.role]': 'label() ? "img" : null',
    '[attr.aria-label]': 'label() || null',
    '[attr.aria-hidden]': 'label() ? null : "true"',
  },
  template: `
    @if (initial(); as letter) {
      <span class="avatar__initial" data-cy="avatar-initial">{{ letter }}</span>
    } @else {
      <app-icon class="avatar__icon" name="user" [size]="iconSize()" />
    }
    @if (src(); as url) {
      <img
        class="avatar__img"
        alt=""
        decoding="async"
        draggable="false"
        data-cy="avatar-image"
        [class.is-loaded]="loadedSrc() === url"
        [src]="url"
        (load)="loadedSrc.set(url)"
      />
    }
  `,
  styles: `
    :host {
      position: relative;
      display: inline-grid;
      flex: none;
      place-items: center;
      overflow: hidden;
      border: var(--border-width) solid var(--color-border);
      border-radius: 50%;
      background-color: var(--color-accent-soft);
      color: var(--color-accent);
      font-weight: var(--weight-medium);
      line-height: 1;
      user-select: none;
    }

    :host(.avatar--sm) {
      width: 2rem;
      height: 2rem;
      font-size: var(--text-sm);
    }

    :host(.avatar--md) {
      width: 2.75rem;
      height: 2.75rem;
      font-size: var(--text-lg);
    }

    :host(.avatar--lg) {
      width: 6rem;
      height: 6rem;
      font-size: 2.5rem;
    }

    .avatar__initial,
    .avatar__icon {
      grid-area: 1 / 1;
    }

    .avatar__img {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
      opacity: 0;
      transition: opacity var(--duration-base) var(--ease-enter);
    }

    .avatar__img.is-loaded {
      opacity: 1;
    }

    @media (prefers-reduced-motion: reduce) {
      .avatar__img {
        transition: none;
      }
    }
  `,
})
export class AvatarComponent {
  readonly name = input<string | null>(null);
  readonly src = input<string | null>(null);
  readonly size = input<AvatarSize>('md');
  readonly label = input('');

  protected readonly loadedSrc = signal<string | null>(null);
  protected readonly iconSize = computed(() => ICON_SIZE[this.size()]);
  protected readonly initial = computed(() => {
    const first = Array.from(this.name()?.trim() ?? '')[0];
    return first ? first.toLocaleUpperCase() : '';
  });
}
