import { Injectable } from '@angular/core';

export interface NoteDraft {
  readonly body: string;
  readonly version: number;
}

const PREFIX = 'moneylog:note-draft:';

@Injectable({ providedIn: 'root' })
export class NoteDraftStore {
  get(noteId: string): NoteDraft | null {
    try {
      const raw = window.sessionStorage.getItem(PREFIX + noteId);
      if (raw === null) return null;
      const value: unknown = JSON.parse(raw);
      if (
        typeof value === 'object' &&
        value !== null &&
        typeof (value as NoteDraft).body === 'string' &&
        typeof (value as NoteDraft).version === 'number'
      ) {
        return { body: (value as NoteDraft).body, version: (value as NoteDraft).version };
      }
    } catch {}
    return null;
  }

  save(noteId: string, draft: NoteDraft): void {
    try {
      window.sessionStorage.setItem(PREFIX + noteId, JSON.stringify(draft));
    } catch {}
  }

  clear(noteId: string): void {
    try {
      window.sessionStorage.removeItem(PREFIX + noteId);
    } catch {}
  }
}
