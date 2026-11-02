// North American VIN check digit (position 9), per 49 CFR 565.

const VIN_VALUES: Record<string, number> = {
  A: 1, B: 2, C: 3, D: 4, E: 5, F: 6, G: 7, H: 8, J: 1, K: 2, L: 3, M: 4, N: 5,
  P: 7, R: 9, S: 2, T: 3, U: 4, V: 5, W: 6, X: 7, Y: 8, Z: 9,
};
const VIN_WEIGHTS = [8, 7, 6, 5, 4, 3, 2, 10, 0, 9, 8, 7, 6, 5, 4, 3, 2];

/** 17 characters, no I, O or Q. */
export const VIN_PATTERN = /^[A-HJ-NPR-Z0-9]{17}$/;

/** Uppercase and strip spaces and dashes, the way VINs get pasted from spreadsheets. */
export function normalizeVin(raw: string): string {
  return raw.replace(/[\s-]/g, "").toUpperCase();
}

/** The check digit a 17-character VIN should carry ("0"–"9" or "X"). */
export function vinCheckDigit(vin: string): string {
  const sum = vin
    .split("")
    .reduce((n, c, i) => n + (VIN_VALUES[c] ?? Number(c)) * VIN_WEIGHTS[i], 0);
  return sum % 11 === 10 ? "X" : String(sum % 11);
}

export function isValidVin(vin: string): boolean {
  return VIN_PATTERN.test(vin) && vin[8] === vinCheckDigit(vin);
}
