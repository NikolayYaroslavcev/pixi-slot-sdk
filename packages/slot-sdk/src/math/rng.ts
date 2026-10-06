/**
 * A source of random numbers for game math. Math takes it as a parameter and never calls
 * `Math.random()`, so the same seed always plays the same rounds: in tests, in a simulation
 * and when a round has to be reproduced from a bug report.
 */
export interface Rng {
  /** A number from 0 (included) to 1 (excluded). */
  next(): number;
}

/** One choice of `pickWeighted` and how often it comes compared to the others. */
export interface Weighted<Value> {
  readonly value: Value;
  readonly weight: number;
}

/**
 * A seeded generator (mulberry32): small, fast and good enough for game math, not for
 * cryptography. Any whole number is a seed; the same seed gives the same sequence.
 */
export function createRng(seed: number): Rng {
  let state = seed >>> 0;
  return {
    next() {
      state = (state + 0x6d2b79f5) >>> 0;
      let mixed = state;
      mixed = Math.imul(mixed ^ (mixed >>> 15), mixed | 1);
      mixed ^= mixed + Math.imul(mixed ^ (mixed >>> 7), mixed | 61);
      return ((mixed ^ (mixed >>> 14)) >>> 0) / 4294967296;
    },
  };
}

/** A whole number from 0 up to `count - 1`. */
export function randomIndex(rng: Rng, count: number): number {
  if (!Number.isInteger(count) || count < 1) {
    throw new Error(`randomIndex: count must be a whole number from 1, got ${String(count)}`);
  }
  return Math.min(Math.floor(rng.next() * count), count - 1);
}

/** One of `choices`, each as often as its weight says. Weights do not need to add up to anything. */
export function pickWeighted<Value>(rng: Rng, choices: readonly Weighted<Value>[]): Value {
  const total = choices.reduce((sum, choice) => sum + choice.weight, 0);
  if (!(total > 0) || choices.some((choice) => choice.weight < 0)) {
    throw new Error('pickWeighted: weights must not be negative and must add up to more than 0');
  }
  let rest = rng.next() * total;
  let picked: Value | undefined;
  for (const choice of choices.filter((candidate) => candidate.weight > 0)) {
    picked = choice.value;
    rest -= choice.weight;
    if (rest < 0) {
      break;
    }
  }
  // Rounding can leave a tiny rest after the last choice: it belongs to the last one with weight.
  return picked as Value;
}
