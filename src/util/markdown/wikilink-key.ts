export function wikilinkKey(target: string): string {
  return target
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\.md$/i, '')
    .toLowerCase();
}
