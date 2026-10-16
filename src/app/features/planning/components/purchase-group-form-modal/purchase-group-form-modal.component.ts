import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
  untracked,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormArray, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { FormModalComponent } from '~/app/common/components/form-modal/form-modal.component';
import type { ChoiceOption } from '~/app/common/components/forms/choice-option';
import { DatePickerComponent } from '~/app/common/components/forms/date-picker/date-picker.component';
import { MoneyInputComponent } from '~/app/common/components/forms/money-input/money-input.component';
import { NumberStepperComponent } from '~/app/common/components/forms/number-stepper/number-stepper.component';
import { SelectComponent } from '~/app/common/components/forms/select/select.component';
import { SwitchComponent } from '~/app/common/components/forms/switch/switch.component';
import { TextFieldComponent } from '~/app/common/components/forms/text-field/text-field.component';
import { dirtySignal } from '~/app/common/forms/dirty-signal';
import { applyProblemToForm } from '~/app/common/forms/problem-form';
import { I18nService } from '~/app/common/i18n/i18n.service';
import { interpolate } from '~/app/common/i18n/interpolate';
import { problemMessage } from '~/app/common/i18n/problem-message';
import { ToastService } from '~/app/common/services/toast.service';
import { CardsListFacade } from '~/modules/cards/core/facades/cards-list.facade';
import { PurchaseGroupFormFacade } from '~/modules/purchase-groups/core/facades/purchase-group-form.facade';
import { PurchaseGroupManageFacade } from '~/modules/purchase-groups/core/facades/purchase-group-manage.facade';
import {
  PURCHASE_GROUP_CURRENCY,
  type PurchaseGroup,
  type PurchaseGroupInput,
  type PurchaseGroupMemberInput,
} from '~/modules/purchase-groups/core/types/purchase-group';

const MAX_INSTALLMENTS = 36;
const MAX_MEMBERS = 10;

const CODE_TO_FIELD: Readonly<Record<string, string>> = {
  PURCHASE_GROUP_INVALID: 'members',
};

function memberGroup() {
  return new FormGroup({
    cardId: new FormControl<string | null>(null, [Validators.required]),
    installmentAmount: new FormControl<string | null>(null),
    totalInstallments: new FormControl<number | null>(null, [Validators.required]),
    remainingInstallments: new FormControl<number | null>(null),
    firstInvoiceDate: new FormControl<string | null>(null),
  });
}

@Component({
  selector: 'app-purchase-group-form-modal',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    FormModalComponent,
    SelectComponent,
    TextFieldComponent,
    MoneyInputComponent,
    NumberStepperComponent,
    DatePickerComponent,
    SwitchComponent,
  ],
  providers: [PurchaseGroupFormFacade, CardsListFacade],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-form-modal
      #modal
      [heading]="editing() ? t().purchaseGroups.form.editTitle : t().purchaseGroups.form.title"
      [dirty]="dirty()"
      [busy]="busy()"
      (closed)="closed.emit()"
    >
      @if (!editing() && cardsStatus() === 'empty') {
        <div class="empty" data-cy="purchase-form-no-cards">
          <p>{{ t().purchaseGroups.form.noCards }}</p>
          <a
            class="button button--primary"
            routerLink="/cards/new"
            data-cy="purchase-form-add-card"
          >
            {{ t().purchaseGroups.form.addCard }}
          </a>
        </div>
      } @else {
        <form
          class="form"
          [formGroup]="form"
          (ngSubmit)="onSubmit()"
          novalidate
          data-cy="purchase-form"
        >
          <p class="hint" data-cy="purchase-form-description">
            {{ editing() ? t().purchaseGroups.form.editNote : t().purchaseGroups.form.description }}
          </p>
          @if (banner(); as message) {
            <p class="banner" role="alert" data-cy="purchase-form-error">{{ message }}</p>
          }
          <app-text-field
            formControlName="name"
            fieldId="purchase-form-name"
            autocomplete="off"
            [maxlength]="100"
            [label]="t().purchaseGroups.form.name"
          />
          <app-switch
            formControlName="interest"
            fieldId="purchase-form-interest"
            [label]="t().purchaseGroups.form.interest"
          />
          @if (!editing()) {
            <app-money-input
              formControlName="declaredTotal"
              fieldId="purchase-form-declared-total"
              [currency]="currency"
              [mandatory]="false"
              [label]="t().purchaseGroups.form.declaredTotal"
              [hint]="t().purchaseGroups.form.declaredHint"
            />

            <fieldset class="members" data-cy="purchase-form-members">
              <legend class="members__title">{{ t().purchaseGroups.form.members }}</legend>
              @for (member of members.controls; track member; let i = $index) {
                <div
                  class="member"
                  [formGroup]="member"
                  [attr.data-cy]="'purchase-form-member-' + i"
                >
                  <p class="member__title">{{ memberTitle(i) }}</p>
                  <app-select
                    formControlName="cardId"
                    [fieldId]="'purchase-form-card-' + i"
                    [options]="cardOptions()"
                    [label]="t().purchaseGroups.form.card"
                  />
                  <app-money-input
                    formControlName="installmentAmount"
                    [fieldId]="'purchase-form-amount-' + i"
                    [currency]="currency"
                    [label]="t().purchaseGroups.form.installmentAmount"
                  />
                  <div class="pair">
                    <app-number-stepper
                      formControlName="totalInstallments"
                      [fieldId]="'purchase-form-total-' + i"
                      [min]="2"
                      [max]="maxInstallments"
                      [label]="t().purchaseGroups.form.totalInstallments"
                    />
                    <app-number-stepper
                      formControlName="remainingInstallments"
                      [fieldId]="'purchase-form-remaining-' + i"
                      [min]="1"
                      [max]="maxInstallments"
                      [mandatory]="false"
                      [label]="t().purchaseGroups.form.remainingInstallments"
                      [hint]="t().purchaseGroups.form.remainingHint"
                    />
                  </div>
                  <app-date-picker
                    formControlName="firstInvoiceDate"
                    [fieldId]="'purchase-form-first-invoice-' + i"
                    [label]="t().purchaseGroups.form.firstInvoiceDate"
                    [hint]="t().purchaseGroups.form.firstInvoiceHint"
                  />
                  @if (members.length > 1) {
                    <button
                      type="button"
                      class="button"
                      [attr.data-cy]="'purchase-form-remove-member-' + i"
                      (click)="removeMember(i)"
                    >
                      {{ removeLabel(i) }}
                    </button>
                  }
                </div>
              }
              @if (members.length < maxMembers) {
                <button
                  type="button"
                  class="button"
                  data-cy="purchase-form-add-member"
                  (click)="addMember()"
                >
                  {{ t().purchaseGroups.form.addMember }}
                </button>
              }
            </fieldset>
          }

          <div class="actions">
            <button
              type="button"
              class="button"
              data-cy="purchase-form-cancel"
              (click)="modal.requestClose()"
            >
              {{ t().purchaseGroups.form.cancel }}
            </button>
            <button
              type="submit"
              class="button button--primary"
              data-cy="purchase-form-save"
              [disabled]="busy()"
              [attr.aria-busy]="busy()"
            >
              {{ busy() ? t().purchaseGroups.form.saving : t().purchaseGroups.form.save }}
            </button>
          </div>
        </form>
      }
    </app-form-modal>
  `,
  styles: `
    :host {
      display: contents;
    }

    .form,
    .empty {
      display: grid;
      gap: var(--space-4);
    }

    .hint {
      margin: 0;
      color: var(--color-text-muted);
      font-size: var(--text-sm);
    }

    .members {
      display: grid;
      gap: var(--space-4);
      min-width: 0;
      margin: 0;
      padding: 0;
      border: 0;
    }

    .members__title {
      padding: 0;
      font-weight: var(--weight-semibold);
    }

    .member {
      display: grid;
      gap: var(--space-4);
      padding: var(--space-4);
      border: var(--border-width) solid var(--color-border);
      border-radius: var(--radius-control);
    }

    .member__title {
      margin: 0;
      font-weight: var(--weight-medium);
    }

    .pair {
      display: grid;
      gap: var(--space-4);
    }

    .actions {
      display: flex;
      flex-wrap: wrap;
      justify-content: flex-end;
      gap: var(--space-2);
    }

    @media (width >= 480px) {
      .pair {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
    }
  `,
})
export class PurchaseGroupFormModalComponent {
  private readonly i18n = inject(I18nService);
  private readonly toast = inject(ToastService);
  private readonly cards = inject(CardsListFacade);
  private readonly manage = inject(PurchaseGroupManageFacade);
  protected readonly t = this.i18n.t;
  protected readonly facade = inject(PurchaseGroupFormFacade);
  protected readonly currency = PURCHASE_GROUP_CURRENCY;
  protected readonly maxInstallments = MAX_INSTALLMENTS;
  protected readonly maxMembers = MAX_MEMBERS;

  readonly group = input<PurchaseGroup | null>(null);

  readonly closed = output<void>();
  readonly saved = output<void>();

  protected readonly editing = computed(() => this.group() !== null);
  protected readonly members = new FormArray([memberGroup()]);
  protected readonly form = new FormGroup({
    name: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(100)],
    }),
    interest: new FormControl(false, { nonNullable: true }),
    declaredTotal: new FormControl<string | null>(null),
    members: this.members,
  });
  protected readonly dirty = dirtySignal(this.form);
  protected readonly busy = computed(() => this.facade.saving() || this.manage.busy());

  protected readonly cardsStatus = computed(() => this.cards.state().status);
  protected readonly cardOptions = computed<readonly ChoiceOption[]>(() =>
    (this.cards.data() ?? []).map((card) => ({ value: card.id, label: card.name })),
  );

  private readonly fieldHandled = signal(false);
  protected readonly banner = computed(() => {
    const problem = this.facade.problem() ?? this.manage.problem();
    if (!problem || this.fieldHandled()) return null;
    return problemMessage(problem, this.t().errors);
  });

  constructor() {
    this.cards.load('ACTIVE');
    effect(() => {
      const group = this.group();
      untracked(() => {
        if (group === null) return;
        this.form.controls.name.setValue(group.name);
        this.form.controls.interest.setValue(group.interest);
        this.form.markAsPristine();
      });
    });
    effect(() => {
      const problem = this.facade.problem();
      untracked(() =>
        this.fieldHandled.set(
          problem ? applyProblemToForm(this.form, problem, CODE_TO_FIELD) : false,
        ),
      );
    });
    this.facade.saved$.pipe(takeUntilDestroyed()).subscribe(() => {
      this.toast.show(this.t().purchaseGroups.form.toast);
      this.saved.emit();
    });
  }

  protected addMember(): void {
    this.members.push(memberGroup());
  }

  protected removeMember(index: number): void {
    this.members.removeAt(index);
    this.form.markAsDirty();
  }

  protected memberTitle(index: number): string {
    return interpolate(this.t().purchaseGroups.form.memberTitle, { number: String(index + 1) });
  }

  protected removeLabel(index: number): string {
    return interpolate(this.t().purchaseGroups.form.removeMember, { number: String(index + 1) });
  }

  protected onSubmit(): void {
    const group = this.group();
    if (group !== null) {
      this.form.controls.name.markAsTouched();
      if (this.form.controls.name.invalid) return;
      this.manage.update(group.id, {
        name: this.form.controls.name.value,
        interest: this.form.controls.interest.value,
        version: group.version,
      });
      return;
    }
    this.form.markAllAsTouched();
    const input = this.toInput();
    if (this.form.invalid || input === null) return;
    this.facade.save(input);
  }

  private toInput(): PurchaseGroupInput | null {
    const value = this.form.getRawValue();
    const members: PurchaseGroupMemberInput[] = [];
    for (const member of value.members) {
      const amount = member.installmentAmount ?? '';
      if (
        member.cardId === null ||
        amount === '' ||
        !member.totalInstallments ||
        !member.firstInvoiceDate
      ) {
        return null;
      }
      members.push({
        cardId: member.cardId,
        totalInstallments: member.totalInstallments,
        installmentAmount: amount,
        remainingInstallments: member.remainingInstallments,
        firstInvoiceDate: member.firstInvoiceDate,
      });
    }
    const name = value.name.trim();
    if (name === '' || members.length === 0) return null;
    return {
      name,
      interest: value.interest,
      declaredTotal:
        value.declaredTotal !== null && value.declaredTotal !== '' ? value.declaredTotal : null,
      members,
    };
  }
}
