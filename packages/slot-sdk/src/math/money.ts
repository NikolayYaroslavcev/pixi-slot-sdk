/**
 * Money is stored as a whole number of minor units (cents), never as a float,
 * so `0.1 + 0.2` style rounding errors cannot appear in balances.
 */
export function isMinorUnits(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;
}

// One format for every amount on screen: thousands separated, always two decimals.
const moneyFormat = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** Text of an amount in minor units, assuming 100 minor units in a major one: 123456 → "1,234.56". */
export function formatMoney(minorUnits: number): string {
  return moneyFormat.format(minorUnits / 100);
}
