/* eslint-disable no-control-regex */
const HIDDEN_ALWAYS =
  /[\u{0}-\u{8}\u{b}\u{c}\u{e}-\u{1f}\u{7f}-\u{9f}\u{61c}\u{180e}\u{200b}-\u{200f}\u{2028}\u{2029}\u{202a}-\u{202e}\u{2060}-\u{206f}\u{feff}\u{fff9}-\u{fffb}]/gu;
const HIDDEN_SINGLE_LINE =
  /[\u{0}-\u{1f}\u{7f}-\u{9f}\u{61c}\u{180e}\u{200b}-\u{200f}\u{2028}\u{2029}\u{202a}-\u{202e}\u{2060}-\u{206f}\u{feff}\u{fff9}-\u{fffb}]/gu;
/* eslint-enable no-control-regex */

function mark(char: string): string {
  const code = char.codePointAt(0) ?? 0;
  return `‹U+${code.toString(16).toUpperCase().padStart(4, '0')}›`;
}

export function displayText(text: string, options: { readonly multiline?: boolean } = {}): string {
  return text.replace(options.multiline ? HIDDEN_ALWAYS : HIDDEN_SINGLE_LINE, mark);
}
