import { describe, expect, it } from 'vitest';
import { World } from '../ecs/World';
import { ReelGrid } from '../reels/ReelGrid';
import { Highlight, HighlightSystem, advanceHighlight, type HighlightData } from './Highlight';

const style = { dimBrightness: 0.4, fadeMs: 200, pulseScale: 0.1, pulseMs: 800 };

function createField() {
  const world = new World();
  const grid = new ReelGrid(world, { reelCount: 2, rowCount: 2 }, [
    ['a', 'b'],
    ['c', 'd'],
  ]);
  const highlight = new HighlightSystem(world, grid, style);
  const lookAt = (reelIndex: number, rowIndex: number) =>
    world.get(grid.symbolEntity({ reelIndex, rowIndex }), Highlight);
  return { world, grid, highlight, lookAt };
}

describe('HighlightSystem', () => {
  it('lights the winning cells and dims every other one', () => {
    const { highlight, lookAt } = createField();

    highlight.show([
      { reelIndex: 0, rowIndex: 0 },
      { reelIndex: 1, rowIndex: 1 },
    ]);

    expect(lookAt(0, 0)?.winning).toBe(true);
    expect(lookAt(1, 1)?.winning).toBe(true);
    expect(lookAt(0, 1)?.winning).toBe(false);
    expect(lookAt(1, 0)?.winning).toBe(false);
  });

  it('fades the other cells to the dim brightness and pulses the winning ones', () => {
    const { highlight, lookAt } = createField();
    highlight.show([{ reelIndex: 0, rowIndex: 0 }]);

    highlight.update(100);
    expect(lookAt(0, 1)?.brightness).toBeCloseTo(0.7);
    highlight.update(300);

    expect(lookAt(0, 1)?.brightness).toBe(0.4);
    expect(lookAt(0, 1)?.scale).toBe(1);
    expect(lookAt(0, 0)?.brightness).toBe(1);
    // Half a pulse in: the winning symbol is at its largest.
    expect(lookAt(0, 0)?.scale).toBeCloseTo(1.1);
  });

  it('moves the light to the next win from the current look', () => {
    const { highlight, lookAt } = createField();
    highlight.show([{ reelIndex: 0, rowIndex: 0 }]);
    highlight.update(1000);

    highlight.show([{ reelIndex: 0, rowIndex: 1 }]);

    expect(lookAt(0, 1)).toMatchObject({ winning: true, brightness: 0.4 });
    highlight.update(100);
    expect(lookAt(0, 1)?.brightness).toBeCloseTo(0.7);
    expect(lookAt(0, 0)?.winning).toBe(false);
  });

  it('returns every symbol to its usual look on clear', () => {
    const { world, highlight } = createField();
    highlight.show([{ reelIndex: 0, rowIndex: 0 }]);
    highlight.update(500);

    highlight.clear();

    expect(world.query(Highlight)).toEqual([]);
  });
});

describe('advanceHighlight', () => {
  it('dims at once without a fade time', () => {
    const look: HighlightData = { winning: false, elapsedMs: 0, brightness: 1, scale: 1 };

    advanceHighlight(look, 16, { ...style, fadeMs: 0 });

    expect(look.brightness).toBe(0.4);
  });
});
