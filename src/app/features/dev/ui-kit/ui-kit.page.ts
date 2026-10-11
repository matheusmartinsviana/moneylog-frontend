import { ChangeDetectionStrategy, Component } from '@angular/core';

import { PageLayoutComponent } from '~/app/common/components/page-layout/page-layout.component';
import { SectionContainerComponent } from '~/app/common/components/section-container/section-container.component';
import { UiKitMatrixComponent } from '~/app/features/dev/ui-kit/ui-kit-matrix.component';

@Component({
  selector: 'app-ui-kit-page',
  imports: [PageLayoutComponent, SectionContainerComponent, UiKitMatrixComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-page-layout
      heading="UI Kit"
      description="Componentes de base em todos os estados, nos dois temas. Só em desenvolvimento."
    >
      <app-section-container
        class="kit-lift"
        heading="Cartão interativo"
        description="Passe o mouse: sobe até 2 px e ganha sombra."
        interactive
        data-cy="ui-kit-lift-card"
      >
        <p>Só com mouse e movimento permitido.</p>
      </app-section-container>
      <div class="kit-themes" data-cy="ui-kit">
        <app-ui-kit-matrix scope="light" />
        <app-ui-kit-matrix scope="dark" />
      </div>
    </app-page-layout>
  `,
  styles: `
    .kit-lift {
      margin-bottom: var(--space-6);
    }

    .kit-themes {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(min(100%, 22rem), 1fr));
      gap: var(--space-6);
      align-items: start;
    }
  `,
})
export class UiKitPage {}
