import type {
  ImportReportResponse,
  NoteCreateRequest,
  NoteResponse,
  NoteSummarySliceResponse,
} from '~/modules/notes/infra/responses/note.response';

export const EMPTY_NOTES: NoteSummarySliceResponse = { items: [], hasNext: false };

export function newMockNote(id: string, body: NoteCreateRequest): NoteResponse {
  const name = (body.path.split('/').pop() ?? body.path).replace(/\.md$/i, '');
  return {
    id,
    path: body.path,
    title: name,
    body: body.body,
    tags: [],
    links: [],
    version: 0,
    trashedAt: null,
    createdAt: '1970-01-01T00:00:00Z',
    updatedAt: '1970-01-01T00:00:00Z',
  };
}

export const MOCK_VAULT_FILENAME = 'moneylog-vault.zip';
export const MOCK_VAULT_ZIP = new Uint8Array([
  0x50, 0x4b, 0x05, 0x06, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
]);

export const MOCK_IMPORT_REPORT: ImportReportResponse = {
  created: 0,
  skipped: 0,
  pendingLinks: 0,
  ignoredFiles: [],
  skippedFiles: [],
  renamedFiles: [],
  warnings: [],
};

export const MOCK_NOTE_SEED_PREFIX = 'moneylog.mock.note.';

export function seededMockNote(id: string): NoteResponse | null {
  try {
    const raw = window.sessionStorage.getItem(MOCK_NOTE_SEED_PREFIX + id);
    if (raw === null) return null;
    const value: unknown = JSON.parse(raw);
    if (typeof value === 'object' && value !== null && (value as NoteResponse).id === id) {
      return value as NoteResponse;
    }
  } catch {}
  return null;
}
