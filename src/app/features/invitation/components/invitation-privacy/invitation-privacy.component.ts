import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-invitation-privacy',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (paragraphs().length > 0) {
      <section
        class="privacy"
        aria-labelledby="invitation-privacy-title"
        data-cy="invitation-privacy"
      >
        <h2 class="privacy__title" id="invitation-privacy-title">{{ heading() }}</h2>
        @for (text of paragraphs(); track $index) {
          <p class="privacy__text">{{ text }}</p>
        }
      </section>
    }
  `,
  styles: `
    :host {
      display: block;
    }

    .privacy {
      display: grid;
      gap: var(--space-2);
      color: var(--color-text-muted);
      font-size: var(--text-sm);
    }

    .privacy__title {
      color: var(--color-text);
      font-size: var(--text-sm);
      font-weight: var(--weight-medium);
    }
  `,
})
export class InvitationPrivacyComponent {
  readonly heading = input.required<string>();
  readonly paragraphs = input<readonly string[]>([]);
}
