export interface Selection {
  readonly start: number;
  readonly end: number;
}

export interface Edit {
  readonly from: number;
  readonly to: number;
  readonly insert: string;
  readonly selectStart: number;
  readonly selectEnd: number;
}

export function toggleWrap(text: string, selection: Selection, marker: string): Edit {
  const { start, end } = selection;
  const selected = text.slice(start, end);
  const before = text.slice(Math.max(0, start - marker.length), start);
  const after = text.slice(end, end + marker.length);
  if (before === marker && after === marker) {
    return {
      from: start - marker.length,
      to: end + marker.length,
      insert: selected,
      selectStart: start - marker.length,
      selectEnd: end - marker.length,
    };
  }
  if (
    selected.length >= marker.length * 2 &&
    selected.startsWith(marker) &&
    selected.endsWith(marker)
  ) {
    const inner = selected.slice(marker.length, selected.length - marker.length);
    return {
      from: start,
      to: end,
      insert: inner,
      selectStart: start,
      selectEnd: start + inner.length,
    };
  }
  if (selected === '') {
    return {
      from: start,
      to: end,
      insert: marker + marker,
      selectStart: start + marker.length,
      selectEnd: start + marker.length,
    };
  }
  return {
    from: start,
    to: end,
    insert: marker + selected + marker,
    selectStart: start + marker.length,
    selectEnd: start + marker.length + selected.length,
  };
}

export function insertLink(text: string, selection: Selection): Edit {
  const { start, end } = selection;
  const selected = text.slice(start, end);
  const label = selected === '' ? 'texto' : selected;
  const insert = `[${label}](url)`;
  const urlStart = start + label.length + 3;
  return { from: start, to: end, insert, selectStart: urlStart, selectEnd: urlStart + 3 };
}

export function insertWikilink(text: string, selection: Selection): Edit {
  const { start, end } = selection;
  const selected = text.slice(start, end);
  return {
    from: start,
    to: end,
    insert: `[[${selected}]]`,
    selectStart: start + 2,
    selectEnd: start + 2 + selected.length,
  };
}

function lineStart(text: string, index: number): number {
  return index <= 0 ? 0 : text.lastIndexOf('\n', index - 1) + 1;
}

function lineEnd(text: string, index: number): number {
  const at = text.indexOf('\n', index);
  return at < 0 ? text.length : at;
}

export function toggleLinePrefix(text: string, selection: Selection, prefix: string): Edit {
  const from = lineStart(text, selection.start);
  const endIndex =
    selection.end > selection.start && text[selection.end - 1] === '\n'
      ? selection.end - 1
      : selection.end;
  const to = lineEnd(text, endIndex);
  const lines = text.slice(from, to).split('\n');
  const allPrefixed = lines.every((line) => line.startsWith(prefix));
  const next = lines.map((line) => (allPrefixed ? line.slice(prefix.length) : prefix + line));
  const insert = next.join('\n');
  const delta = (allPrefixed ? -1 : 1) * prefix.length;
  const selectStart = Math.max(from, selection.start + delta);
  return {
    from,
    to,
    insert,
    selectStart,
    selectEnd: Math.max(selectStart, selection.end + delta * lines.length),
  };
}

const INDENT = '  ';

export function indent(text: string, selection: Selection, outdent: boolean): Edit | null {
  const { start, end } = selection;
  const multiline = text.slice(start, end).includes('\n');
  if (!outdent && !multiline) {
    return {
      from: start,
      to: end,
      insert: INDENT,
      selectStart: start + INDENT.length,
      selectEnd: start + INDENT.length,
    };
  }
  const from = lineStart(text, start);
  const to = lineEnd(text, end > start && text[end - 1] === '\n' ? end - 1 : end);
  const lines = text.slice(from, to).split('\n');
  let removedFirst = 0;
  let removedTotal = 0;
  const next = lines.map((line, index) => {
    if (!outdent) return INDENT + line;
    const match = /^( {1,2}|\t)/.exec(line);
    const removed = match ? match[0].length : 0;
    if (index === 0) removedFirst = removed;
    removedTotal += removed;
    return line.slice(removed);
  });
  if (outdent && removedTotal === 0) return null;
  const insert = next.join('\n');
  if (!outdent) {
    return {
      from,
      to,
      insert,
      selectStart: start + INDENT.length,
      selectEnd: end + INDENT.length * lines.length,
    };
  }
  return {
    from,
    to,
    insert,
    selectStart: Math.max(from, start - removedFirst),
    selectEnd: Math.max(from, end - removedTotal),
  };
}

export interface WikilinkContext {
  readonly start: number;
  readonly query: string;
}

export function wikilinkContext(text: string, caret: number): WikilinkContext | null {
  const lineFrom = lineStart(text, caret);
  const before = text.slice(lineFrom, caret);
  const open = before.lastIndexOf('[[');
  if (open < 0) return null;
  const query = before.slice(open + 2);
  if (/[\][\n]/.test(query) || query.length > 120) return null;
  const fences = (text.slice(0, lineFrom).match(/^(```|~~~)/gm) ?? []).length;
  if (fences % 2 === 1) return null;
  return { start: lineFrom + open + 2, query };
}

export function completeWikilink(
  text: string,
  context: WikilinkContext,
  caret: number,
  target: string,
): Edit {
  const closing = text.slice(caret, caret + 2) === ']]' ? 2 : 0;
  const insert = `${target}]]`;
  return {
    from: context.start,
    to: caret + closing,
    insert,
    selectStart: context.start + insert.length,
    selectEnd: context.start + insert.length,
  };
}
