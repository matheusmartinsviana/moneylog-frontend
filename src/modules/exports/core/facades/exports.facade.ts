import { computed, inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, exhaustMap, map, Observable, of, Subject, tap } from 'rxjs';

import { ExportsGateway } from '~/modules/exports/core/interfaces/exports.gateway';
import type {
  DownloadedFile,
  ExportKind,
  TransactionsExportQuery,
} from '~/modules/exports/core/types/export';
import { Problem, problemOf } from '~/util/api/problem';

type Command =
  { readonly kind: 'csv'; readonly query: TransactionsExportQuery } | { readonly kind: 'backup' };

@Injectable()
export class ExportsFacade {
  private readonly gateway = inject(ExportsGateway);
  private readonly commands = new Subject<Command>();
  private readonly fileEvents = new Subject<{
    readonly kind: ExportKind;
    readonly file: DownloadedFile;
  }>();
  private readonly runningState = signal<ExportKind | null>(null);
  private readonly problemState = signal<{
    readonly kind: ExportKind;
    readonly problem: Problem;
  } | null>(null);
  private last: Command | null = null;

  readonly running = this.runningState.asReadonly();
  readonly busy = computed(() => this.runningState() !== null);
  readonly failure = this.problemState.asReadonly();
  readonly file$ = this.fileEvents.asObservable();

  constructor() {
    this.commands
      .pipe(
        exhaustMap((command) => {
          this.runningState.set(command.kind);
          this.problemState.set(null);
          return this.send(command).pipe(
            tap((file) => this.fileEvents.next({ kind: command.kind, file })),
            map(() => null),
            catchError((error: unknown) => of(problemOf(error))),
          );
        }),
        takeUntilDestroyed(),
      )
      .subscribe((problem) => {
        const kind = this.runningState();
        this.runningState.set(null);
        this.problemState.set(problem !== null && kind !== null ? { kind, problem } : null);
      });
  }

  exportCsv(query: TransactionsExportQuery): void {
    this.dispatch({ kind: 'csv', query });
  }

  exportBackup(): void {
    this.dispatch({ kind: 'backup' });
  }

  retry(): void {
    if (this.last) this.commands.next(this.last);
  }

  clearProblem(): void {
    this.problemState.set(null);
  }

  private dispatch(command: Command): void {
    this.last = command;
    this.commands.next(command);
  }

  private send(command: Command): Observable<DownloadedFile> {
    return command.kind === 'csv'
      ? this.gateway.transactionsCsv(command.query)
      : this.gateway.backup();
  }
}
