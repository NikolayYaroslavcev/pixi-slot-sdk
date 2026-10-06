import { describe, expect, it } from 'vitest';
import { createReelMotion } from './reelMotion';
import { poolSlot, slotSymbol, stripSymbol, wrapIndex } from './reelSlots';

const strip = ['a', 'b', 'c', 'd', 'e'];
const field = { rowCount: 2, symbolAt: (rowIndex: number) => `field${String(rowIndex)}` };

describe('wrapIndex', () => {
  it('keeps numbers inside the length as they are', () => {
    expect(wrapIndex(0, 5)).toBe(0);
    expect(wrapIndex(4, 5)).toBe(4);
  });

  it('wraps past the end to the start and below 0 to the end', () => {
    expect(wrapIndex(5, 5)).toBe(0);
    expect(wrapIndex(12, 5)).toBe(2);
    expect(wrapIndex(-1, 5)).toBe(4);
    expect(wrapIndex(-11, 5)).toBe(4);
  });
});

describe('stripSymbol', () => {
  it('reads the strip as an endless loop in both directions', () => {
    expect(stripSymbol(strip, 0)).toBe('a');
    expect(stripSymbol(strip, 4)).toBe('e');
    expect(stripSymbol(strip, 5)).toBe('a');
    expect(stripSymbol(strip, -1)).toBe('e');
    expect(stripSymbol(strip, -5)).toBe('a');
    expect(stripSymbol(strip, -1_000_001)).toBe('e');
  });

  it('names an empty strip', () => {
    expect(() => stripSymbol([], 0)).toThrow('Reel strip is empty');
  });
});

describe('poolSlot', () => {
  const rowCount = 4;
  const poolSize = rowCount + 2;

  function rowsOfPool(position: number): number[] {
    return Array.from(
      { length: poolSize },
      (_sprite, poolIndex) => poolSlot(poolIndex, position, poolSize) + position,
    ).sort((first, second) => first - second);
  }

  it('at rest puts one spare sprite above and one below the visible rows', () => {
    expect(rowsOfPool(0)).toEqual([-1, 0, 1, 2, 3, 4]);
    expect(rowsOfPool(37)).toEqual([-1, 0, 1, 2, 3, 4]);
  });

  it('between rows covers the visible area from above to below with no gaps', () => {
    expect(rowsOfPool(0.25)).toEqual([-0.75, 0.25, 1.25, 2.25, 3.25, 4.25]);
    expect(rowsOfPool(-3.5)).toEqual([-0.5, 0.5, 1.5, 2.5, 3.5, 4.5]);
  });

  it('keeps every sprite on its slot while the reel moves less than a row', () => {
    for (let poolIndex = 0; poolIndex < poolSize; poolIndex += 1) {
      expect(poolSlot(poolIndex, 10.1, poolSize)).toBe(poolSlot(poolIndex, 10.9, poolSize));
    }
  });

  it('moves only the sprite that leaves at the bottom, and to the top', () => {
    const changed = [0, 1, 2, 3, 4, 5].filter(
      (poolIndex) => poolSlot(poolIndex, 10.9, poolSize) !== poolSlot(poolIndex, 11.1, poolSize),
    );
    expect(changed).toHaveLength(1);
    const [movedSprite = -1] = changed;
    expect(poolSlot(movedSprite, 10.9, poolSize) + 10.9).toBeCloseTo(4.9);
    expect(poolSlot(movedSprite, 11.1, poolSize) + 11.1).toBeCloseTo(-0.9);
  });
});

describe('slotSymbol', () => {
  it('shows the field where the reel last stopped and the strip around it', () => {
    const motion = { ...createReelMotion(), restSlot: -7 };
    expect(slotSymbol(-7, motion, strip, field)).toBe('field0');
    expect(slotSymbol(-6, motion, strip, field)).toBe('field1');
    expect(slotSymbol(-8, motion, strip, field)).toBe(stripSymbol(strip, -8));
    expect(slotSymbol(-5, motion, strip, field)).toBe(stripSymbol(strip, -5));
  });

  it('shows the target in the planned landing slots', () => {
    const motion = {
      ...createReelMotion(),
      target: ['x', 'y'],
      plan: { stopPosition: 20, brakeFrom: 17, landingSlot: -20 },
    };
    expect(slotSymbol(-20, motion, strip, field)).toBe('x');
    expect(slotSymbol(-19, motion, strip, field)).toBe('y');
    expect(slotSymbol(-21, motion, strip, field)).toBe(stripSymbol(strip, -21));
    expect(slotSymbol(-18, motion, strip, field)).toBe(stripSymbol(strip, -18));
  });

  it('ignores a target until the landing is planned', () => {
    const motion = { ...createReelMotion(), restSlot: 100, target: ['x', 'y'] };
    expect(slotSymbol(0, motion, strip, field)).toBe('a');
  });
});
