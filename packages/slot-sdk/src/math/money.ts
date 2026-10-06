/**
 * Money is stored as a whole number of minor units (cents), never as a float,
 * so `0.1 + 0.2` style rounding errors cannot appear in balances.
 */
export function isMinorUnits(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;
}
