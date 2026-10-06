/**
 * Reads `?seed=` from the page address: a whole number from 0 that makes the mock play
 * the same rounds again. Anything else is reported in the console and ignored.
 */
export function seedFromAddress(search: string): number | undefined {
  const value = new URLSearchParams(search).get('seed');
  if (value === null) {
    return undefined;
  }
  const seed = Number(value);
  if (!Number.isSafeInteger(seed) || seed < 0) {
    console.warn(`Unknown seed "${value}". A seed is a whole number from 0.`);
    return undefined;
  }
  return seed;
}

/**
 * A new seed for a session without `?seed=`. It comes from the browser's crypto source,
 * not from the game math, so the math itself never needs `Math.random()`.
 */
export function freshSeed(): number {
  return crypto.getRandomValues(new Uint32Array(1))[0] ?? 0;
}
