import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  output,
  untracked,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

import { MoneyInputComponent } from '~/app/common/components/forms/money-input/money-input.component';
import { I18nService } from '~/app/common/i18n/i18n.service';
import { interpolate } from '~/app/common/i18n/interpolate';
import { problemMessage } from '~/app/common/i18n/problem-message';
import { ToastService } from '~/app/common/services/toast.service';
import { InvoiceDocumentFacade } from '~/modules/cards/core/facades/invoice-document.facade';
import type { Invoice } from '~/modules/cards/core/types/invoice';
import { formatMoney } from '~/util/money';

@Component({
  selector: 'app-invoice-document',
  imports: [ReactiveFormsModule, MoneyInputComponent],
  providers: [InvoiceDocumentFacade],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './invoice-document.component.html',
  styleUrl: './invoice-document.component.css',
})
export class InvoiceDocumentComponent {
  private readonly toast = inject(ToastService);
  protected readonly t = inject(I18nService).t;
  protected readonly facade = inject(InvoiceDocumentFacade);

  readonly invoice = input.required<Invoice>();
  readonly saved = output<Invoice>();
  readonly conflict = output<void>();

  protected readonly control = new FormControl<string | null>(null);

  protected readonly divergenceText = computed(() => {
    const divergence = this.invoice().documentDivergence;
    return divergence
      ? interpolate(this.t().cards.invoice.document.divergence, {
          amount: formatMoney(divergence),
        })
      : null;
  });
  protected readonly errorText = computed(() => {
    const problem = this.facade.problem();
    return problem ? problemMessage(problem, this.t().errors) : null;
  });
  protected readonly hasValue = computed(() => this.invoice().documentAmount !== null);

  private lastSent: 'saved' | 'cleared' = 'saved';

  constructor() {
    effect(() => {
      const amount = this.invoice().documentAmount?.amount ?? null;
      untracked(() => this.control.setValue(amount, { emitEvent: false }));
    });
    effect(() => {
      if (this.facade.problem()?.code === 'VERSION_CONFLICT') {
        untracked(() => this.conflict.emit());
      }
    });
    this.facade.saved$.pipe(takeUntilDestroyed()).subscribe((invoice) => {
      this.toast.show(
        this.lastSent === 'cleared'
          ? this.t().cards.invoice.document.cleared
          : this.t().cards.invoice.document.saved,
      );
      this.saved.emit(invoice);
    });
  }

  protected save(): void {
    const value = this.control.value;
    if (value === null || this.control.invalid) return;
    this.lastSent = 'saved';
    this.facade.save(this.invoice().id, value, this.invoice().documentVersion);
  }

  protected clear(): void {
    this.lastSent = 'cleared';
    this.facade.save(this.invoice().id, null, this.invoice().documentVersion);
  }
}
