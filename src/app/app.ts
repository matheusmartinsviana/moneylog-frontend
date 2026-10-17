import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { AuroraBackdropComponent } from '~/app/common/components/aurora-backdrop/aurora-backdrop.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, AuroraBackdropComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<app-aurora-backdrop /><router-outlet />',
})
export class App {}
