export function groupThousands(digits: string): string {
  let grouped = '';
  for (let i = 0; i < digits.length; i++) {
    if (i > 0 && (digits.length - i) % 3 === 0) grouped += '.';
    grouped += digits[i];
  }
  return grouped;
}

export function fmt(amount: string): string {
  const neg = amount.startsWith('-');
  const abs = neg ? amount.slice(1) : amount;
  const [int = '0', frac = '00'] = abs.split('.');
  const isZero = /^0+(\.0+)?$/.test(abs);
  return `${neg && !isZero ? '−' : ''}R$ ${groupThousands(int)},${frac.padEnd(2, '0')}`;
}
