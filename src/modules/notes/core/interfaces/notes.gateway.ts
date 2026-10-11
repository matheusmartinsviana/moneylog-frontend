import { Observable } from 'rxjs';

import type {
  Backlink,
  LinkedNotesQuery,
  Note,
  NoteInput,
  NoteLinkRef,
  NoteMoved,
  NotesQuery,
  NoteSummary,
  TagCount,
} from '~/modules/notes/core/types/note';
import type { Slice } from '~/util/api/slice';

export abstract class NotesGateway {
  abstract list(query: NotesQuery): Observable<Slice<NoteSummary>>;
  abstract get(id: string): Observable<Note>;
  abstract create(input: NoteInput, idempotencyKey: string): Observable<Note>;
  abstract update(id: string, body: string, version: number): Observable<Note>;
  abstract move(id: string, newPath: string, version: number): Observable<NoteMoved>;
  abstract trash(id: string): Observable<Note>;
  abstract restore(id: string): Observable<Note>;
  abstract emptyTrash(): Observable<void>;
  abstract backlinks(id: string, page: number, pageSize: number): Observable<Slice<Backlink>>;
  abstract setLinks(id: string, links: readonly NoteLinkRef[], version: number): Observable<Note>;
  abstract linkedTo(query: LinkedNotesQuery): Observable<Slice<NoteSummary>>;
  abstract tags(): Observable<readonly TagCount[]>;
}
