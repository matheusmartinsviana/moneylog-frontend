import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';

import { DialogComponent } from '~/app/common/components/dialog/dialog.component';
import { I18nService } from '~/app/common/i18n/i18n.service';
import { interpolate } from '~/app/common/i18n/interpolate';
import { ClipboardService } from '~/app/common/services/clipboard.service';
import { SHORTCUT_INSTALL_URL } from '~/app/config/shortcut';
import type { QuickEntrySecret } from '~/modules/quick-entry/core/types/quick-entry-token';

type CopyState = 'idle' | 'copied' | 'failed';

@Component({
  selector: 'app-token-secret-dialog',
  imports: [DialogComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './token-secret-dialog.component.html',
  styleUrl: './token-secret-dialog.component.css',
})
export class TokenSecretDialogComponent {
  private readonly clipboard = inject(ClipboardService);
  protected readonly t = inject(I18nService).t;
  protected readonly installUrl = SHORTCUT_INSTALL_URL;

  readonly secret = input<QuickEntrySecret | null>(null);

  readonly closed = output<void>();

  protected readonly copyState = signal<CopyState>('idle');
  protected readonly tokenLabel = computed(() =>
    interpolate(this.t().quickEntry.secret.tokenLabel, { label: this.secret()?.label ?? '' }),
  );

  protected async copy(): Promise<void> {
    const value = this.secret()?.value;
    if (!value) return;
    const copied = await this.clipboard.copy(value);
    this.copyState.set(copied ? 'copied' : 'failed');
  }

  protected close(): void {
    this.copyState.set('idle');
    this.closed.emit();
  }
}
