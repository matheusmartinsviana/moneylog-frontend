import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  OnInit,
  untracked,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';

import { AvatarComponent } from '~/app/common/components/avatar/avatar.component';
import { ErrorStateComponent } from '~/app/common/components/error-state/error-state.component';
import { FilesButtonComponent } from '~/app/common/components/forms/files-button/files-button.component';
import { TextFieldComponent } from '~/app/common/components/forms/text-field/text-field.component';
import { SectionContainerComponent } from '~/app/common/components/section-container/section-container.component';
import { I18nService } from '~/app/common/i18n/i18n.service';
import { problemMessage } from '~/app/common/i18n/problem-message';
import { ProfileFacade } from '~/modules/notifications/core/facades/profile.facade';
import { PROFILE_PHOTO_ACCEPT } from '~/modules/notifications/core/types/notification';

const NAME_MAX = 60;

@Component({
  selector: 'app-profile-section',
  imports: [
    AvatarComponent,
    ErrorStateComponent,
    FilesButtonComponent,
    ReactiveFormsModule,
    SectionContainerComponent,
    TextFieldComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './profile-section.component.html',
  styleUrl: './profile-section.component.css',
})
export class ProfileSectionComponent implements OnInit {
  protected readonly t = inject(I18nService).t;
  protected readonly profile = inject(ProfileFacade);
  protected readonly accept = PROFILE_PHOTO_ACCEPT;
  protected readonly nameMax = NAME_MAX;
  protected readonly nickname = new FormControl('', {
    nonNullable: true,
    validators: [Validators.maxLength(NAME_MAX)],
  });

  protected readonly ready = computed(() => this.profile.settings() !== null);
  protected readonly loadProblem = computed(() =>
    this.profile.status() === 'error' ? this.profile.problem() : null,
  );
  protected readonly actionError = computed(() => {
    const problem = this.profile.problem();
    if (!problem || !this.ready()) return null;
    return problem.code === 'VERSION_CONFLICT'
      ? this.t().notifications.settings.conflict
      : problemMessage(problem, this.t().errors);
  });
  protected readonly noticeText = computed(() => {
    const notice = this.profile.notice();
    return notice === null ? null : this.copyFor(notice);
  });
  private readonly typed = toSignal(this.nickname.valueChanges, { initialValue: '' });
  protected readonly unchanged = computed(
    () => this.typed().trim() === (this.profile.displayName() ?? ''),
  );

  constructor() {
    effect(() => {
      const name = this.profile.displayName() ?? '';
      untracked(() => {
        if (!this.nickname.dirty) this.nickname.setValue(name);
      });
    });
  }

  ngOnInit(): void {
    this.profile.dismissFeedback();
    this.profile.load();
  }

  protected pick(files: File[]): void {
    const file = files[0];
    if (file && !this.profile.busy()) this.profile.uploadPhoto(file);
  }

  protected remove(): void {
    if (!this.profile.busy()) this.profile.removePhoto();
  }

  protected save(event: Event): void {
    event.preventDefault();
    this.nickname.markAsTouched();
    if (this.nickname.invalid || this.profile.busy()) return;
    this.profile.saveDisplayName(this.nickname.value);
    this.nickname.markAsPristine();
  }

  private copyFor(notice: 'saved' | 'photoUpdated' | 'photoRemoved'): string {
    const copy = this.t().settings.profile;
    if (notice === 'photoUpdated') return copy.photoUpdated;
    if (notice === 'photoRemoved') return copy.photoRemoved;
    return copy.saved;
  }
}
