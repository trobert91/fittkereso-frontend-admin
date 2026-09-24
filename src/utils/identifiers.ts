/**
 * Mirrors normalizeGtin / normalizeMpn in the backend's libs/utils, so a filter
 * input can say a value will match nothing before the search comes back empty.
 * The backend applies the same rules again; these only decide the hint.
 */

/** The canonical GTIN-14, or undefined when the value is not a usable GTIN. */
export function normalizeGtin(raw: string): string | undefined {
  const digits = raw.trim().replace(/[\s.-]/g, "");
  if (!/^\d+$/.test(digits) || ![8, 12, 13, 14].includes(digits.length)) {
    return undefined;
  }

  const gtin = digits.padStart(14, "0");
  if (/^0+$/.test(gtin)) return undefined;

  let sum = 0;
  for (let i = 0; i < 13; i += 1) {
    sum += Number(gtin[i]) * (i % 2 === 0 ? 3 : 1);
  }
  if ((10 - (sum % 10)) % 10 !== Number(gtin[13])) return undefined;

  // Restricted-circulation numbers are a shop's own in-store codes.
  const body = gtin.slice(1);
  if (body.startsWith("2") || body.startsWith("02") || body.startsWith("04")) {
    return undefined;
  }
  return gtin;
}

/** Uppercased with spaces and hyphens dropped, or undefined under 5 characters. */
export function normalizeMpn(raw: string): string | undefined {
  const mpn = raw.trim().toUpperCase().replace(/[\s-]/g, "");
  return mpn.length >= 5 ? mpn : undefined;
}
