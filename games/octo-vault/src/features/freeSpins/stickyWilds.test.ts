import { Held, ReelGrid, World } from 'slot-sdk';
import { describe, expect, it } from 'vitest';
import { reelsConfig } from '../../config/reels.config';
import type { SymbolId } from '../../config/symbols';
import { noWinGrid } from '../../math/testGrids';
import { Multiplier } from '../../scene/Multiplier';
import { holdStickyWilds, releaseStickyWilds } from './stickyWilds';

function createGrid() {
  const world = new World();
  const grid = new ReelGrid<SymbolId>(world, reelsConfig.size, noWinGrid);
  return { world, grid };
}

const sticky = [
  { cell: { reelIndex: 1, rowIndex: 2 }, multiplier: 3 },
  { cell: { reelIndex: 3, rowIndex: 0 }, multiplier: 0 },
];

describe('sticky Wilds on the field', () => {
  it('are held as Wilds with their multipliers', () => {
    const { world, grid } = createGrid();
    holdStickyWilds(world, grid, sticky);

    for (const { cell, multiplier } of sticky) {
      const symbol = grid.symbolEntity(cell);
      expect(grid.symbolAt(cell)).toBe('octopus');
      expect(world.has(symbol, Held)).toBe(true);
      expect(world.get(symbol, Multiplier)?.value).toBe(multiplier || undefined);
    }
    expect(world.query(Held)).toHaveLength(2);
  });

  it('can be held again for the next spin without changing anything', () => {
    const { world, grid } = createGrid();
    holdStickyWilds(world, grid, sticky);
    const entities = sticky.map(({ cell }) => grid.symbolEntity(cell));
    holdStickyWilds(world, grid, sticky);

    expect(sticky.map(({ cell }) => grid.symbolEntity(cell))).toEqual(entities);
    expect(world.query(Held)).toHaveLength(2);
  });

  it('are all released at the end of the series, keeping what the field shows', () => {
    const { world, grid } = createGrid();
    holdStickyWilds(world, grid, sticky);
    releaseStickyWilds(world);

    expect(world.query(Held)).toEqual([]);
    expect(grid.symbolAt({ reelIndex: 1, rowIndex: 2 })).toBe('octopus');
  });

  it('release safely when nothing is held', () => {
    const { world } = createGrid();

    expect(() => {
      releaseStickyWilds(world);
    }).not.toThrow();
  });
});
