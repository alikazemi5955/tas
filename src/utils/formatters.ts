export function toPersianDigits(str: string | number): string {
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return String(str).replace(/[0-9]/g, (w) => persianDigits[+w]);
}

export function formatToman(toman: number): string {
  const formatted = Math.round(toman).toLocaleString('en-US');
  return toPersianDigits(formatted) + ' تومان';
}

export function formatRial(rial: number): string {
  const formatted = Math.round(rial).toLocaleString('en-US');
  return toPersianDigits(formatted) + ' ریال';
}

export function rialToToman(rial: number | string): number {
  if (!rial && rial !== 0) return 0;
  const num = typeof rial === 'number' ? Math.trunc(rial) : parseInt(String(rial).replace(/[^\d-]/g, ''), 10);
  if (isNaN(num)) return 0;
  // Drop the last digit without rounding up or down (e.g. 223,262,985 Rial -> 22,326,298 Toman)
  return Math.trunc(num / 10);
}
