import { Observable } from 'rxjs';

import type {
  DownloadedFile,
  ImportConflictMode,
  ImportReport,
} from '~/modules/notes/core/types/note';

export abstract class VaultGateway {
  abstract export(): Observable<DownloadedFile>;
  abstract import(file: File, mode: ImportConflictMode): Observable<ImportReport>;
}
