import { describe, expect, it } from 'vitest';
import { World } from '../ecs/World';
import { GridPosition, Reel, SymbolKind } from './components';
import { ReelGrid } from './ReelGrid';

type TestSymbol = 'a' | 'b' | 'c' | 'wild';

const size = { reelCount: 5, rowCount: 4 };
const columns: TestSymbol[][] = [
  ['a', 'b', 'c', 'a'],
  ['b', 'c', 'a', 'b'],
  ['c', 'a', 'wild', 'c'],
  ['a', 'b', 'c', 'a'],
  ['b', 'c', 'a', 'b'],
];

function createGrid(): { world: World; grid: ReelGrid<TestSymbol> } {
  const world = new World();
  return { world, grid: new ReelGrid(world, size, columns) };
}

describe('ReelGrid', () => {
  it('creates 5 reel entities and 20 symbol entities', () => {
    const { world, grid } = createGrid();

    expect(world.query(Reel)).toHaveLength(5);
    expect(world.query(GridPosition, SymbolKind)).toHaveLength(20);
    expect(grid.visibleCells).toHaveLength(20);
    expect(grid.size).toEqual(size);
  });

  it('lists visible cells reel by reel, top to bottom', () => {
    const { grid } = createGrid();

    expect(grid.visibleCells.slice(0, 5)).toEqual([
      { reelIndex: 0, rowIndex: 0 },
      { reelIndex: 0, rowIndex: 1 },
      { reelIndex: 0, rowIndex: 2 },
      { reelIndex: 0, rowIndex: 3 },
      { reelIndex: 1, rowIndex: 0 },
    ]);
    expect(grid.visibleCells.at(-1)).toEqual({ reelIndex: 4, rowIndex: 3 });
  });

  it('reads columns as reels: columns[reel][row]', () => {
    const { grid } = createGrid();

    expect(grid.symbolAt({ reelIndex: 2, rowIndex: 2 })).toBe('wild');
    expect(grid.symbolAt({ reelIndex: 1, rowIndex: 0 })).toBe('b');
    expect(grid.symbolAt({ reelIndex: 0, rowIndex: 1 })).toBe('b');
  });

  it('gives every symbol entity the position of its cell', () => {
    const { world, grid } = createGrid();

    for (const cell of grid.visibleCells) {
      expect(world.get(grid.symbolEntity(cell), GridPosition)).toEqual(cell);
    }
  });

  it('numbers reel entities by their place', () => {
    const { world, grid } = createGrid();

    expect(world.get(grid.reelEntity(3), Reel)).toEqual({ reelIndex: 3 });
  });

  it('sets a symbol and keeps the entity with its other components', () => {
    const { world, grid } = createGrid();
    const cell = { reelIndex: 4, rowIndex: 1 };
    const entity = grid.symbolEntity(cell);
    world.add(entity, Reel, { reelIndex: 99 });

    grid.setSymbol(cell, 'wild');

    expect(grid.symbolAt(cell)).toBe('wild');
    expect(grid.symbolEntity(cell)).toBe(entity);
    expect(world.has(entity, Reel)).toBe(true);
  });

  it('replaces a symbol with a fresh entity and destroys the old one', () => {
    const { world, grid } = createGrid();
    const cell = { reelIndex: 1, rowIndex: 3 };
    const old = grid.symbolEntity(cell);

    const fresh = grid.replaceSymbol(cell, 'c');

    expect(fresh).not.toBe(old);
    expect(world.isAlive(old)).toBe(false);
    expect(grid.symbolEntity(cell)).toBe(fresh);
    expect(grid.symbolAt(cell)).toBe('c');
    expect(world.get(fresh, GridPosition)).toEqual(cell);
    expect(world.query(GridPosition, SymbolKind)).toHaveLength(20);
  });

  it('does not change other cells when one changes', () => {
    const { grid } = createGrid();

    grid.replaceSymbol({ reelIndex: 0, rowIndex: 0 }, 'wild');
    grid.setSymbol({ reelIndex: 0, rowIndex: 3 }, 'wild');

    expect(grid.symbolAt({ reelIndex: 0, rowIndex: 1 })).toBe('b');
    expect(grid.symbolAt({ reelIndex: 1, rowIndex: 0 })).toBe('b');
  });

  it('names the cell outside the field', () => {
    const { grid } = createGrid();

    expect(() => grid.symbolAt({ reelIndex: 5, rowIndex: 0 })).toThrow(
      'ReelGrid: cell reel 5, row 0 is outside the field',
    );
    expect(() => grid.symbolAt({ reelIndex: 0, rowIndex: 4 })).toThrow(/outside the field/);
    expect(() => grid.reelEntity(-1)).toThrow('ReelGrid: reel -1 is outside the field');
  });

  it('rejects starting symbols that do not match the size', () => {
    const world = new World();

    expect(() => new ReelGrid(world, size, columns.slice(0, 4))).toThrow(
      'ReelGrid: expected 5 reels of symbols, got 4',
    );
    const shortReel = columns.map((column, index) => (index === 2 ? column.slice(1) : column));
    expect(() => new ReelGrid(world, size, shortReel)).toThrow(
      'ReelGrid: reel 2 must have 4 symbols',
    );
    expect(() => new ReelGrid(world, { reelCount: 0, rowCount: 4 }, [])).toThrow(
      /size must be whole numbers/,
    );
  });
});
