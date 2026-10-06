import { describe, expect, it } from 'vitest';
import { rowCenterY } from './reelGeometry';
import { createReelMotion } from './reelMotion';
import { slotSymbol, stripSymbol } from './reelSlots';
import { planStop } from './reelStop';

const rowCount = 4;
const brakingDistance = 3.72;
const metrics = { cellWidth: 170, cellHeight: 170, gap: 12 };
const strip = ['shell', 'shell', 'key', 'pearl', 'octopus', 'shell', 'fish'];
const oldField = { rowCount, symbolAt: () => 'old' };

/** Symbols in the rows `fromRow`..`toRow` once the reel planned at `position` is at rest. */
function rowsAtStop(position: number, target: readonly string[], fromRow = 0, toRow = 3): string[] {
  const plan = planStop(position, rowCount, brakingDistance);
  const motion = { ...createReelMotion(), restSlot: -1_000_000, plan, target };
  return Array.from({ length: toRow - fromRow + 1 }, (_row, offset) =>
    slotSymbol(fromRow + offset - plan.stopPosition, motion, strip, oldField),
  );
}

describe('planStop', () => {
  it('stops on a whole position, at least the braking distance ahead', () => {
    const plan = planStop(10.3, rowCount, 6.5);
    expect(plan.stopPosition).toBe(17);
    expect(plan.brakeFrom).toBeCloseTo(10.5);
    expect(plan.brakeFrom).toBeGreaterThanOrEqual(10.3);
  });

  it('keeps the landing slots out of view when braking is short', () => {
    const plan = planStop(10.3, rowCount, 1);
    expect(plan.stopPosition).toBe(15);
    // Row of the bottom landing slot at planning time: fully above the window.
    expect(rowCount - 1 + plan.landingSlot + 10.3).toBeLessThanOrEqual(-1);
  });

  it('on a whole position does not stop later than it has to', () => {
    expect(planStop(8, rowCount, 4).stopPosition).toBe(12);
  });

  it('puts the top row of the stop into the landing slot', () => {
    const plan = planStop(3.2, rowCount, brakingDistance);
    expect(plan.landingSlot).toBe(-plan.stopPosition);
  });

  it.each([
    ['the start of the strip', 0],
    ['the end of the strip', strip.length - 0.4],
    ['the wrap from the end to the start', strip.length * 3 - 1.5],
    ['far along', 123_456.78],
    ['a position between rows', 2.5],
  ])('lands exactly on the target from %s', (_name, position) => {
    const target = ['key', 'fish', 'pearl', 'octopus'];
    expect(rowsAtStop(position, target)).toEqual(target);
  });

  it('lands on the same symbol in a row, also where the strip repeats it', () => {
    const allShells = ['shell', 'shell', 'shell', 'shell'];
    expect(rowsAtStop(1.1, allShells)).toEqual(allShells);
    expect(rowsAtStop(1.1, ['shell', 'shell', 'key', 'shell'])).toEqual([
      'shell',
      'shell',
      'key',
      'shell',
    ]);
  });

  it('lands on symbols the strip does not have', () => {
    const target = ['crown', 'crown', 'anchor', 'chest'];
    expect(rowsAtStop(5, target)).toEqual(target);
  });

  it('shows the strip right above and below the landed rows, wrapped', () => {
    for (const position of [0, strip.length - 1, -2.5]) {
      const stopPosition = planStop(position, rowCount, brakingDistance).stopPosition;
      const [above, below] = [
        rowsAtStop(position, ['x', 'x', 'x', 'x'], -1, -1)[0],
        rowsAtStop(position, ['x', 'x', 'x', 'x'], 4, 4)[0],
      ];
      expect(above).toBe(stripSymbol(strip, -1 - stopPosition));
      expect(below).toBe(stripSymbol(strip, rowCount - stopPosition));
    }
  });

  it('puts every landed symbol exactly on the center of its cell', () => {
    const plan = planStop(41.37, rowCount, brakingDistance);
    for (let rowIndex = 0; rowIndex < rowCount; rowIndex += 1) {
      const slot = plan.landingSlot + rowIndex;
      expect(rowCenterY(slot + plan.stopPosition, metrics)).toBe(rowCenterY(rowIndex, metrics));
    }
  });
});
