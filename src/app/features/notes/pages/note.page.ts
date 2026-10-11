import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  input,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { debounceTime } from 'rxjs';

import { ChipComponent } from '~/app/common/components/chip/chip.component';
import { ConfirmDialogComponent } from '~/app/common/components/confirm-dialog/confirm-dialog.component';
import { EmptyStateComponent } from '~/app/common/components/empty-state/empty-state.component';
import { ErrorStateComponent } from '~/app/common/components/error-state/error-state.component';
import { MenuComponent, type MenuItem } from '~/app/common/components/menu/menu.component';
import { ViewportService } from '~/app/common/components/overlay/viewport.service';
import { PageLayoutComponent } from '~/app/common/components/page-layout/page-layout.component';
import { TabPanelDirective } from '~/app/common/components/tabs/tab-panel.directive';
import { type TabItem, TabsComponent } from '~/app/common/components/tabs/tabs.component';
import { valueSignal } from '~/app/common/forms/control-signal';
import { HTML_LANG } from '~/app/common/i18n/i18n';
import { I18nService } from '~/app/common/i18n/i18n.service';
import { interpolate } from '~/app/common/i18n/interpolate';
import { problemMessage } from '~/app/common/i18n/problem-message';
import { DisplayTextPipe } from '~/app/common/pipes/display-text.pipe';
import { ToastService } from '~/app/common/services/toast.service';
import { ConflictPanelComponent } from '~/app/features/notes/components/conflict-panel/conflict-panel.component';
import { LinkPickerSheetComponent } from '~/app/features/notes/components/link-picker-sheet/link-picker-sheet.component';
import { MarkdownEditorComponent } from '~/app/features/notes/components/markdown-editor/markdown-editor.component';
import { MarkdownViewComponent } from '~/app/features/notes/components/markdown-view/markdown-view.component';
import { MoveNoteSheetComponent } from '~/app/features/notes/components/move-note-sheet/move-note-sheet.component';
import { NewNoteSheetComponent } from '~/app/features/notes/components/new-note-sheet/new-note-sheet.component';
import { NoteLinksPanelComponent } from '~/app/features/notes/components/note-links-panel/note-links-panel.component';
import { NoteDraftStore } from '~/app/features/notes/services/note-draft.store';
import { NoteEditorFacade } from '~/modules/notes/core/facades/note-editor.facade';
import type { Note, NoteLink, NoteLinkRef, NoteRef } from '~/modules/notes/core/types/note';
import {
  applyLinkChange,
  explicitRefs,
  refOfLink,
} from '~/modules/notes/core/types/note-link-refs';
import { isTooLarge, noteFolder, noteName } from '~/modules/notes/core/types/note-path';
import { formatInstant } from '~/util/date';
import { displayText } from '~/util/display-text';

export const PREVIEW_DEBOUNCE_MS = 300;
export const DRAFT_DEBOUNCE_MS = 500;

function normalizeEol(text: string): string {
  return text.replace(/\r\n?/g, '\n');
}

@Component({
  selector: 'app-note-page',
  imports: [
    NgTemplateOutlet,
    ReactiveFormsModule,
    RouterLink,
    PageLayoutComponent,
    EmptyStateComponent,
    ErrorStateComponent,
    ConfirmDialogComponent,
    MenuComponent,
    TabsComponent,
    TabPanelDirective,
    ChipComponent,
    MarkdownEditorComponent,
    MarkdownViewComponent,
    ConflictPanelComponent,
    MoveNoteSheetComponent,
    NewNoteSheetComponent,
    NoteLinksPanelComponent,
    LinkPickerSheetComponent,
    DisplayTextPipe,
  ],
  providers: [NoteEditorFacade],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(keydown)': 'onKeydown($event)' },
  templateUrl: './note.page.html',
  styleUrl: './note.page.css',
})
export class NotePage {
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  private readonly drafts = inject(NoteDraftStore);
  private readonly i18n = inject(I18nService);
  protected readonly viewport = inject(ViewportService);
  protected readonly t = this.i18n.t;
  protected readonly facade = inject(NoteEditorFacade);

  readonly id = input.required<string>();

  protected readonly note = this.facade.note;
  protected readonly loadStatus = this.facade.loadStatus;
  protected readonly heading = computed(() => {
    const title = this.note()?.title;
    return title ? displayText(title) : this.t().nav.notes;
  });
  protected readonly trashed = this.facade.trashed;
  protected readonly conflict = this.facade.conflict;
  protected readonly canKeepMine = computed(() => {
    const conflict = this.conflict();
    return conflict !== null && (conflict.during === 'save' || this.dirty());
  });
  protected readonly notFound = computed(() => {
    const state = this.loadStatus();
    return state.status === 'error' && state.problem.status === 404;
  });
  protected readonly loadProblem = computed(() => {
    const state = this.loadStatus();
    return state.status === 'error' ? state.problem : null;
  });

  protected readonly text = new FormControl('', { nonNullable: true });
  protected readonly draft = valueSignal(this.text);
  protected readonly previewText = signal('');
  protected readonly mode = signal<string | null>('write');

  protected readonly draftRecovered = signal(false);
  protected readonly dirty = computed(
    () =>
      this.note() !== null &&
      !this.trashed() &&
      normalizeEol(this.draft()) !== normalizeEol(this.facade.baseline()),
  );
  protected readonly tooLarge = computed(() => isTooLarge(this.draft()));
  protected readonly canSave = computed(
    () => this.dirty() && !this.facade.busy() && !this.tooLarge() && this.conflict() === null,
  );

  protected readonly statusText = computed(() => {
    const copy = this.t().notes.editor;
    if (this.facade.saving()) return copy.saving;
    return this.dirty() ? copy.unsaved : copy.saved;
  });
  protected readonly modeTabs = computed<readonly TabItem[]>(() => [
    { id: 'write', label: this.t().notes.editor.write },
    { id: 'read', label: this.t().notes.editor.read },
  ]);
  protected readonly menuItems = computed<readonly MenuItem[]>(() => {
    const copy = this.t().notes.editor;
    return [
      { id: 'rename', label: copy.rename, disabled: this.trashed() },
      { id: 'trash', label: copy.moveToTrash, destructive: true, disabled: this.trashed() },
    ];
  });
  protected readonly updated = computed(() => {
    const note = this.note();
    return note
      ? interpolate(this.t().notes.editor.updated, {
          date: formatInstant(note.updatedAt, HTML_LANG[this.i18n.language()]),
        })
      : '';
  });
  protected readonly problemText = computed(() => {
    const problem = this.facade.problem();
    if (!problem || this.pickerOpen() || this.moveOpen()) return null;
    if (problem.code === 'VERSION_CONFLICT') {
      return this.conflict() === null ? this.t().notes.editor.conflict.remoteLoadFailed : null;
    }
    return problemMessage(problem, this.t().errors);
  });
  protected readonly moveProblem = computed(() => (this.moveOpen() ? this.facade.problem() : null));

  protected readonly moveOpen = signal(false);
  protected readonly confirmingTrash = signal(false);
  protected readonly leaving = signal(false);
  protected readonly lastMove = signal<readonly NoteRef[] | null>(null);
  protected readonly createFromLink = signal<string | null>(null);
  protected readonly pickerOpen = signal(false);

  protected readonly explicitRefs = computed<readonly NoteLinkRef[]>(() =>
    explicitRefs(this.note()?.links ?? []),
  );
  protected readonly pickerProblem = computed(() =>
    this.pickerOpen() ? this.facade.problem() : null,
  );

  private readonly editor = viewChild(MarkdownEditorComponent);
  private leaveResolver: ((leave: boolean) => void) | null = null;

  constructor() {
    effect(() => {
      const id = this.id();
      untracked(() => {
        this.lastMove.set(null);
        this.facade.load(id);
      });
    });
    effect(() => {
      const state = this.loadStatus();
      if (state.status !== 'ready') return;
      untracked(() => {
        this.reset(state.note.body);
        this.recoverDraft(state.note);
      });
    });
    effect(() => {
      const conflict = this.conflict();
      if (!conflict || this.dirty()) return;
      if (conflict.during === 'move' || conflict.during === 'links') {
        untracked(() => this.facade.adoptRemoteAndRedo());
      }
    });
    this.text.valueChanges
      .pipe(debounceTime(PREVIEW_DEBOUNCE_MS), takeUntilDestroyed())
      .subscribe((value) => this.previewText.set(value));

    this.text.valueChanges
      .pipe(debounceTime(DRAFT_DEBOUNCE_MS), takeUntilDestroyed())
      .subscribe(() => this.persistDraft());

    this.facade.replaced$.pipe(takeUntilDestroyed()).subscribe((note) => {
      this.reset(note.body);
      this.drafts.clear(note.id);
      this.draftRecovered.set(false);
    });
    this.facade.saved$.pipe(takeUntilDestroyed()).subscribe(({ note }) => {
      this.drafts.clear(note.id);
      this.draftRecovered.set(false);
      this.toast.show(this.t().notes.editor.savedToast);
      this.previewText.set(this.text.value);
    });
    this.facade.trashed$.pipe(takeUntilDestroyed()).subscribe((note) => {
      this.confirmingTrash.set(false);
      this.reset(note.body);
      this.toast.show(this.t().notes.editor.trashedToast);
    });
    this.facade.restored$.pipe(takeUntilDestroyed()).subscribe((note) => {
      this.reset(note.body);
      this.toast.show(this.t().notes.editor.restoredToast);
    });
    this.facade.links$.pipe(takeUntilDestroyed()).subscribe(() => {
      this.pickerOpen.set(false);
      this.toast.show(this.t().notes.links.saved);
    });
    this.facade.moved$.pipe(takeUntilDestroyed()).subscribe((moved) => {
      this.moveOpen.set(false);
      this.lastMove.set(moved.rewrittenNotes);
      this.toast.show(this.t().notes.editor.move.moved);
    });

    const view = inject(DestroyRef);
    const handler = (event: BeforeUnloadEvent) => {
      if (!this.dirty()) return;
      event.preventDefault();
    };
    window.addEventListener('beforeunload', handler);
    const hidden = () => {
      if (document.visibilityState === 'hidden') this.persistDraft();
    };
    document.addEventListener('visibilitychange', hidden);
    window.addEventListener('pagehide', hidden);
    view.onDestroy(() => {
      window.removeEventListener('beforeunload', handler);
      document.removeEventListener('visibilitychange', hidden);
      window.removeEventListener('pagehide', hidden);
    });
  }

  private persistDraft(): void {
    const note = this.note();
    if (!note) return;
    if (this.dirty()) this.drafts.save(note.id, { body: this.draft(), version: note.version });
    else this.drafts.clear(note.id);
  }

  private recoverDraft(note: Note): void {
    const draft = this.drafts.get(note.id);
    if (!draft || note.trashedAt != null) return;
    if (draft.version !== note.version || normalizeEol(draft.body) === normalizeEol(note.body)) {
      this.drafts.clear(note.id);
      return;
    }
    this.text.setValue(draft.body);
    this.previewText.set(draft.body);
    this.draftRecovered.set(true);
  }

  protected discardDraft(): void {
    const note = this.note();
    if (note) this.drafts.clear(note.id);
    this.draftRecovered.set(false);
    this.reset(this.facade.baseline());
  }

  private reset(body: string): void {
    this.text.setValue(body);
    this.previewText.set(body);
  }

  protected onKeydown(event: KeyboardEvent): void {
    if ((event.ctrlKey || event.metaKey) && !event.altKey && event.key.toLowerCase() === 's') {
      event.preventDefault();
      this.save();
    }
  }

  protected save(): void {
    if (this.canSave()) this.facade.save(this.draft());
  }

  protected keepMine(): void {
    this.facade.saveOverConflict(this.draft());
  }

  protected onMenu(id: string): void {
    if (id === 'rename') {
      this.facade.dismissProblem();
      this.moveOpen.set(true);
    } else if (id === 'trash') {
      this.facade.dismissProblem();
      this.confirmingTrash.set(true);
    }
  }

  protected openPicker(): void {
    this.facade.dismissProblem();
    this.pickerOpen.set(true);
  }

  protected closePicker(): void {
    this.pickerOpen.set(false);
    this.facade.dismissProblem();
  }

  protected addLink(ref: NoteLinkRef): void {
    this.facade.setLinks(applyLinkChange(this.explicitRefs(), { add: ref }), { add: ref });
  }

  protected removeLink(link: NoteLink): void {
    const ref = refOfLink(link);
    this.facade.setLinks(applyLinkChange(this.explicitRefs(), { remove: ref }), { remove: ref });
  }

  protected closeMove(): void {
    this.moveOpen.set(false);
    this.facade.dismissProblem();
  }

  protected cancelTrash(): void {
    if (!this.facade.busy()) this.confirmingTrash.set(false);
  }

  protected retry(): void {
    this.facade.load(this.id());
  }

  protected readonly noteName = noteName;
  protected readonly noteFolder = noteFolder;

  protected countText(count: number): string {
    return interpolate(this.t().notes.editor.move.rewrittenMany, { count: String(count) });
  }

  protected askCreate(target: string): void {
    this.createFromLink.set(target);
  }

  protected createdFromLink(): void {
    this.createFromLink.set(null);
    this.facade.refresh();
  }

  confirmLeave(): Promise<boolean> {
    if (!this.dirty()) return Promise.resolve(true);
    this.leaveResolver?.(false);
    this.leaving.set(true);
    return new Promise<boolean>((resolve) => {
      this.leaveResolver = resolve;
    });
  }

  protected answerLeave(leave: boolean): void {
    const note = this.note();
    if (leave && note) this.drafts.clear(note.id);
    this.leaving.set(false);
    this.leaveResolver?.(leave);
    this.leaveResolver = null;
  }

  protected openNotes(): void {
    void this.router.navigate(['/notes']);
  }

  focusEditor(): void {
    this.editor()?.focus();
  }
}
