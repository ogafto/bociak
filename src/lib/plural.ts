/** Polska odmiana liczebników: 1 serwer, 2 serwery, 5 serwerów. */
export function plural(n: number, one: string, few: string, many: string) {
  if (n === 1) return one;
  const d = n % 10;
  const t = n % 100;
  return d >= 2 && d <= 4 && (t < 12 || t > 14) ? few : many;
}

/** „1 284 osoby” – liczba z odstępami i odmianą. */
export function count(n: number, one: string, few: string, many: string) {
  return `${n.toLocaleString("pl-PL")} ${plural(n, one, few, many)}`;
}
