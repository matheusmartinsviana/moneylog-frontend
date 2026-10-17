import { MAX_NOTE_BYTES, MAX_PATH_LENGTH } from '~/modules/notes/core/types/note';
import type { NoteSummary } from '~/modules/notes/core/types/note';
import { trimMatching } from '~/util/trim';

const FORBIDDEN_PATH_CHARS =
  // eslint-disable-next-line no-control-regex
  /[<>:"|?*#^[\]\\\u0000-\u001f\u007f-\u009f\u200b-\u200f\u202a-\u202e\u2066-\u2069]/;
const MAX_DEPTH = 10;
const isDotOrSpace = (char: string): boolean => char === '.' || /\s/.test(char);

export type PathProblem = 'EMPTY' | 'TOO_LONG' | 'TOO_DEEP' | 'INVALID';

export function noteName(path: string): string {
  const file = path.slice(path.lastIndexOf('/') + 1);
  return file.replace(/\.md$/i, '');
}

export function noteFolder(path: string): string {
  const index = path.lastIndexOf('/');
  return index < 0 ? '' : path.slice(0, index);
}

export function pathWithoutExtension(path: string): string {
  return path.replace(/\.md$/i, '');
}

export function buildNotePath(folder: string, name: string): string {
  const cleanFolder = folder
    .split('/')
    .map((part) => part.trim())
    .filter((part) => part !== '')
    .join('/');
  const file = name.trim().replace(/\.md$/i, '').trim();
  return `${cleanFolder === '' ? '' : `${cleanFolder}/`}${file}.md`;
}

export function pathProblem(path: string): PathProblem | null {
  if (path.replace(/\.md$/i, '').replace(/\//g, '').trim() === '') return 'EMPTY';
  if (path.length > MAX_PATH_LENGTH) return 'TOO_LONG';
  const segments = path.split('/');
  if (segments.length > MAX_DEPTH) return 'TOO_DEEP';
  if (path.startsWith('/') || path.includes('..') || FORBIDDEN_PATH_CHARS.test(path)) {
    return 'INVALID';
  }
  if (segments.some((segment) => segment.trim() === '' || segment.startsWith('.'))) {
    return 'INVALID';
  }
  return null;
}

export function safeFileName(label: string): string {
  const cleaned = label
    .replace(/[<>:"|?*#^[\]\\/]/g, ' ')
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u001f\u007f-\u009f\u200b-\u200f\u202a-\u202e\u2066-\u2069]/g, '')
    .replace(/\s+/g, ' ');
  return trimMatching(cleaned, isDotOrSpace).slice(0, 80).trim();
}

export function utf8Length(text: string): number {
  return new TextEncoder().encode(text).length;
}

export function isTooLarge(text: string): boolean {
  if (text.length <= MAX_NOTE_BYTES / 4) return false;
  return utf8Length(text) > MAX_NOTE_BYTES;
}

export interface FolderNode {
  readonly path: string;
  readonly name: string;
  readonly count: number;
  readonly children: readonly FolderNode[];
}

export function buildFolderTree(notes: readonly Pick<NoteSummary, 'path'>[]): FolderNode {
  interface Mutable {
    path: string;
    name: string;
    count: number;
    children: Map<string, Mutable>;
  }
  const root: Mutable = { path: '', name: '', count: 0, children: new Map() };
  for (const note of notes) {
    root.count++;
    const parts = noteFolder(note.path).split('/').filter(Boolean);
    let node = root;
    let acc = '';
    for (const part of parts) {
      acc = acc === '' ? part : `${acc}/${part}`;
      let child = node.children.get(part);
      if (!child) {
        child = { path: acc, name: part, count: 0, children: new Map() };
        node.children.set(part, child);
      }
      child.count++;
      node = child;
    }
  }
  const freeze = (node: Mutable): FolderNode => ({
    path: node.path,
    name: node.name,
    count: node.count,
    children: [...node.children.values()]
      .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }))
      .map(freeze),
  });
  return freeze(root);
}
