export function trimMatching(text: string, matches: (char: string) => boolean): string {
  let start = 0;
  let end = text.length;
  while (start < end && matches(text.charAt(start))) start++;
  while (end > start && matches(text.charAt(end - 1))) end--;
  return text.slice(start, end);
}
