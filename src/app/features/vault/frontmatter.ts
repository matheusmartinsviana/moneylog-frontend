export interface FrontmatterEntry {
  readonly key: string;
  readonly value: string;
}

export interface SplitNote {
  readonly meta: readonly FrontmatterEntry[] | null;
  readonly content: string;
}

const BLOCK = /^---[ \t]*\r?\n([\s\S]*?)\r?\n---[ \t]*(?:\r?\n|$)/;

export function splitFrontmatter(body: string): SplitNote {
  const match = BLOCK.exec(body);
  if (!match) return { meta: null, content: body };
  const meta: FrontmatterEntry[] = [];
  for (const line of (match[1] ?? '').split(/\r?\n/)) {
    const at = line.indexOf(':');
    if (at <= 0) continue;
    const key = line.slice(0, at).trim();
    if (!/^[\w.-]+$/.test(key)) continue;
    meta.push({ key, value: line.slice(at + 1).trim() });
  }
  return { meta, content: body.slice(match[0].length) };
}
