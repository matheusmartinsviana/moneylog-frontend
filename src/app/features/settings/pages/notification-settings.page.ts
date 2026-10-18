import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  OnInit,
  untracked,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { RouterLink } from '@angular/router';

import { ErrorStateComponent } from '~/app/common/components/error-state/error-state.component';
import type { ChoiceOption } from '~/app/common/components/forms/choice-option';
import { MoneyInputComponent } from '~/app/common/components/forms/money-input/money-input.component';
import { NumberStepperComponent } from '~/app/common/components/forms/number-stepper/number-stepper.component';
import { SelectComponent } from '~/app/common/components/forms/select/select.component';
import { SwitchComponent } from '~/app/common/components/forms/switch/switch.component';
import { TextFieldComponent } from '~/app/common/components/forms/text-field/text-field.component';
import { TimePickerComponent } from '~/app/common/components/forms/time-picker/time-picker.component';
import { PageLayoutComponent } from '~/app/common/components/page-layout/page-layout.component';
import { SectionContainerComponent } from '~/app/common/components/section-container/section-container.component';
import { I18nService } from '~/app/common/i18n/i18n.service';
import { problemMessage } from '~/app/common/i18n/problem-message';
import { NotificationSettingsFacade } from '~/modules/notifications/core/facades/notification-settings.facade';
import { PushFacade } from '~/modules/notifications/core/facades/push.facade';
import {
  ALERT_KINDS,
  BASE_KINDS,
  CONFIGURABLE_KINDS,
  type ConfigurableKind,
  type NotificationSettings,
  type SummaryFrequency,
} from '~/modules/notifications/core/types/notification';

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;
const FREQUENCIES: readonly SummaryFrequency[] = ['DAILY', 'ONLY_DUE', 'OFF'];
const UNUSED_DAYS = /^\d{1,4}$/;
const UNUSED_DAYS_MAX = 3650;
const LEAD_DAYS_MIN = 1;
const LEAD_DAYS_MAX = 30;

function unusedDaysValidator(control: AbstractControl): ValidationErrors | null {
  const value = String(control.value ?? '').trim();
  if (value === '') return null;
  if (!UNUSED_DAYS.test(value)) return { pattern: true };
  const days = Number(value);
  return days >= 1 && days <= UNUSED_DAYS_MAX ? null : { pattern: true };
}

@Component({
  selector: 'app-notification-settings-page',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    PageLayoutComponent,
    SectionContainerComponent,
    ErrorStateComponent,
    MoneyInputComponent,
    NumberStepperComponent,
    SelectComponent,
    SwitchComponent,
    TextFieldComponent,
    TimePickerComponent,
  ],
  providers: [NotificationSettingsFacade, PushFacade],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './notification-settings.page.html',
  styleUrl: './notification-settings.page.css',
})
export class NotificationSettingsPage implements OnInit {
  protected readonly t = inject(I18nService).t;
  protected readonly facade = inject(NotificationSettingsFacade);
  protected readonly push = inject(PushFacade);
  protected readonly baseKinds = BASE_KINDS;
  protected readonly alertKinds = ALERT_KINDS;
  protected readonly leadMin = LEAD_DAYS_MIN;
  protected readonly leadMax = LEAD_DAYS_MAX;
  protected readonly currency = 'BRL';

  protected readonly form = new FormGroup({
    dailyEnabled: new FormControl(true, { nonNullable: true }),
    dailyTime: new FormControl('08:00', {
      nonNullable: true,
      validators: [Validators.required, Validators.pattern(TIME)],
    }),
    frequency: new FormControl<string | null>('DAILY'),
    quietFrom: new FormControl('22:00', {
      nonNullable: true,
      validators: [Validators.required, Validators.pattern(TIME)],
    }),
    quietTo: new FormControl('07:00', {
      nonNullable: true,
      validators: [Validators.required, Validators.pattern(TIME)],
    }),
    displayName: new FormControl('', { nonNullable: true, validators: [Validators.maxLength(60)] }),
    unusedDays: new FormControl('', { nonNullable: true, validators: [unusedDaysValidator] }),
    leadDays: new FormControl<number | null>(3, [
      Validators.required,
      Validators.min(LEAD_DAYS_MIN),
      Validators.max(LEAD_DAYS_MAX),
    ]),
    tolerance: new FormControl<string | null>('0.00', [Validators.required]),
    kinds: new FormGroup(
      Object.fromEntries(
        CONFIGURABLE_KINDS.map((kind) => [kind, new FormControl(true, { nonNullable: true })]),
      ) as Record<ConfigurableKind, FormControl<boolean>>,
    ),
  });

  protected readonly frequencyOptions = computed<readonly ChoiceOption[]>(() =>
    FREQUENCIES.map((value) => ({
      value,
      label: this.t().notifications.settings.frequencies[value],
    })),
  );
  protected readonly loadProblem = computed(() => {
    const state = this.facade.state();
    return state.status === 'error' ? state.problem : null;
  });
  protected readonly saveError = computed(() => {
    const problem = this.facade.problem();
    if (!problem) return null;
    return problem.code === 'VERSION_CONFLICT'
      ? this.t().notifications.settings.conflict
      : problemMessage(problem, this.t().errors);
  });
  protected readonly pushError = computed(() => {
    const problem = this.push.problem();
    return problem ? problemMessage(problem, this.t().errors) : null;
  });
  protected readonly pushText = computed(() => {
    const copy = this.t().notifications.settings.push;
    switch (this.push.status()) {
      case 'loading':
        return copy.loading;
      case 'server-off':
        return copy.serverOff;
      case 'unsupported':
        return copy.unsupported;
      case 'ios-needs-install':
        return copy.iosNeedsInstall;
      case 'denied':
        return copy.denied;
      case 'subscribed':
        return copy.active;
      case 'error':
        return copy.error;
      default:
        return copy.ready;
    }
  });

  private keepEditsOnNextLoad = false;

  constructor() {
    effect(() => {
      const settings = this.facade.settings();
      if (!settings) return;
      untracked(() => {
        if (this.keepEditsOnNextLoad && this.form.dirty) {
          this.keepEditsOnNextLoad = false;
          return;
        }
        this.keepEditsOnNextLoad = false;
        this.fill(settings);
      });
    });
    this.push.changed$.pipe(takeUntilDestroyed()).subscribe(() => {
      this.keepEditsOnNextLoad = true;
      this.facade.load();
    });
    this.form.valueChanges.subscribe(() => this.facade.markEdited());
  }

  ngOnInit(): void {
    this.facade.load();
    this.push.load();
  }

  protected save(): void {
    this.form.markAllAsTouched();
    const current = this.facade.settings();
    if (!current || this.form.invalid || this.facade.saving()) return;
    const value = this.form.getRawValue();
    const frequency = FREQUENCIES.find((f) => f === value.frequency) ?? 'DAILY';
    const next: NotificationSettings = {
      dailySummary: { enabled: value.dailyEnabled, time: value.dailyTime, frequency },
      kinds: value.kinds,
      quietHours: { from: value.quietFrom, to: value.quietTo },
      push: current.push,
      displayName: value.displayName.trim() === '' ? null : value.displayName.trim(),
      alerts: {
        subscriptionUnusedDays:
          value.unusedDays.trim() === '' ? null : Number(value.unusedDays.trim()),
        invoiceDueLeadDays: value.leadDays ?? current.alerts.invoiceDueLeadDays,
        documentDivergenceTolerance: value.tolerance ?? current.alerts.documentDivergenceTolerance,
      },
      version: current.version,
      hasPhoto: current.hasPhoto,
      photoVersion: current.photoVersion,
    };
    this.facade.save(next);
  }

  private fill(settings: NotificationSettings): void {
    this.form.reset(
      {
        dailyEnabled: settings.dailySummary.enabled,
        dailyTime: settings.dailySummary.time,
        frequency: settings.dailySummary.frequency,
        quietFrom: settings.quietHours.from,
        quietTo: settings.quietHours.to,
        displayName: settings.displayName ?? '',
        unusedDays:
          settings.alerts.subscriptionUnusedDays === null
            ? ''
            : String(settings.alerts.subscriptionUnusedDays),
        leadDays: settings.alerts.invoiceDueLeadDays,
        tolerance: settings.alerts.documentDivergenceTolerance,
        kinds: Object.fromEntries(
          CONFIGURABLE_KINDS.map((kind) => [kind, settings.kinds[kind] !== false]),
        ),
      },
      { emitEvent: false },
    );
  }
}
