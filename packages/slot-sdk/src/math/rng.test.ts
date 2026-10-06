import { describe, expect, it } from 'vitest';
import { createRng, pickWeighted, randomIndex, type Rng } from './rng';

function sequence(rng: Rng, count: number): number[] {
  return Array.from({ length: count }, () => rng.next());
}

/** An Rng that returns the given numbers in turn. */
function scripted(values: number[]): Rng {
  let index = 0;
  return { next: () => values[index++ % values.length] ?? 0 };
}

describe('createRng', () => {
  it('gives the same sequence for the same seed', () => {
    expect(sequence(createRng(42), 50)).toEqual(sequence(createRng(42), 50));
  });

  it('gives another sequence for another seed', () => {
    expect(sequence(createRng(1), 10)).not.toEqual(sequence(createRng(2), 10));
  });

  it('stays from 0 up to 1 and spreads evenly', () => {
    const values = sequence(createRng(7), 20_000);
    const buckets = [0, 0, 0, 0];
    for (const value of values) {
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
      const bucket = Math.floor(value * 4);
      buckets[bucket] = (buckets[bucket] ?? 0) + 1;
    }
    for (const bucket of buckets) {
      expect(bucket / values.length).toBeCloseTo(0.25, 1);
    }
  });
});

describe('randomIndex', () => {
  it('maps the range to whole indexes', () => {
    expect(randomIndex(scripted([0]), 4)).toBe(0);
    expect(randomIndex(scripted([0.999999]), 4)).toBe(3);
    expect(randomIndex(scripted([0.5]), 4)).toBe(2);
  });

  it('rejects a count below 1', () => {
    expect(() => randomIndex(scripted([0]), 0)).toThrow(/count/);
  });
});

describe('pickWeighted', () => {
  const choices = [
    { value: 'a', weight: 1 },
    { value: 'b', weight: 0 },
    { value: 'c', weight: 3 },
  ];

  it('picks by the share of the weight', () => {
    expect(pickWeighted(scripted([0]), choices)).toBe('a');
    expect(pickWeighted(scripted([0.24]), choices)).toBe('a');
    expect(pickWeighted(scripted([0.25]), choices)).toBe('c');
    expect(pickWeighted(scripted([0.999]), choices)).toBe('c');
  });

  it('never picks a choice without weight', () => {
    const rng = createRng(3);
    for (let draw = 0; draw < 1000; draw += 1) {
      expect(pickWeighted(rng, choices)).not.toBe('b');
    }
  });

  it('rejects weights that add up to nothing', () => {
    expect(() => pickWeighted(scripted([0]), [{ value: 'a', weight: 0 }])).toThrow(/weights/);
  });
});
