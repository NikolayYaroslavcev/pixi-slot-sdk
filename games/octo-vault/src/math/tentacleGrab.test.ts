import { createRng, type CellPosition } from 'slot-sdk';
import { describe, expect, it } from 'vitest';
import type { TentacleGrabSettings } from '../config/features.config';
import type { SymbolGrid, SymbolId } from '../config/symbols';
import { plainField, wildCells } from './field';
import { grabTentacles } from './tentacleGrab';
import { noWinGrid, scriptedRng, withSymbol } from './testGrids';

/** Every choice equally likely: a scripted 0, 0.4 or 0.8 picks the first, second or third. */
const even: TentacleGrabSettings = {
  tentacles: [2, 3, 4].map((value) => ({ value, weight: 1 })),
  multipliers: [2, 3, 5].map((value) => ({ value, weight: 1 })),
};

const octopus: CellPosition = { reelIndex: 1, rowIndex: 1 };

/** `noWinGrid` with Chests along the top row and an Octopus in the second row of reel 2. */
const field: SymbolGrid = withSymbol(
  noWinGrid.map((column) =>
    column.map((symbolId, row): SymbolId => (row === 0 ? 'chest' : symbolId)),
  ),
  octopus,
  'octopus',
);

function grabWith(values: number[], grid: SymbolGrid = field) {
  return grabTentacles(plainField(grid), wildCells(grid), scriptedRng(values), even);
}

describe('grabTentacles', () => {
  it('throws 2, 3 or 4 tentacles from every Octopus', () => {
    const rng = createRng(11);
    const counts = new Set<number>();
    for (let round = 0; round < 300; round += 1) {
      const [grab] = grabTentacles(plainField(field), [octopus], rng, even).grabs;
      counts.add(grab?.hits.length ?? 0);
    }

    expect([...counts].sort()).toEqual([2, 3, 4]);
  });

  it('turns a grabbed cell into a Wild with the multiplier of the tentacle', () => {
    // 2 tentacles: the first free cell with ×2, the second with ×5.
    const result = grabWith([0, 0, 0, 0.1, 0.8]);
    const [grab] = result.grabs;

    expect(grab?.from).toEqual(octopus);
    expect(grab?.hits).toEqual([
      { cell: { reelIndex: 0, rowIndex: 1 }, multiplier: 2 },
      { cell: { reelIndex: 0, rowIndex: 2 }, multiplier: 5 },
    ]);
    expect(result.field.grid[0]?.slice(1, 3)).toEqual(['octopus', 'octopus']);
    expect(result.field.multipliers[0]?.slice(1, 3)).toEqual([2, 5]);
  });

  it('adds up the multipliers of tentacles that grab the same cell', () => {
    // 3 tentacles, all at the first free cell: ×3, then ×5, then ×2.
    const result = grabWith([0.4, 0, 0.4, 0, 0.8, 0, 0]);

    expect(result.grabs[0]?.hits.map((hit) => hit.multiplier)).toEqual([3, 8, 10]);
    expect(result.field.multipliers[0]?.[1]).toBe(10);
  });

  it('never grabs a Scatter or a Wild that was on the field before', () => {
    const rng = createRng(5);
    for (let round = 0; round < 300; round += 1) {
      const { grabs } = grabTentacles(plainField(field), [octopus], rng, even);
      for (const { cell } of grabs.flatMap((grab) => grab.hits)) {
        expect(field[cell.reelIndex]?.[cell.rowIndex]).not.toBe('chest');
        expect(cell).not.toEqual(octopus);
      }
    }
  });

  it('lets every Octopus grab, in the order of the field', () => {
    const second = { reelIndex: 3, rowIndex: 3 };
    const { grabs } = grabWith(Array<number>(10).fill(0), withSymbol(field, second, 'octopus'));

    expect(grabs.map((grab) => grab.from)).toEqual([octopus, second]);
    expect(grabs.map((grab) => grab.hits.length)).toEqual([2, 2]);
  });

  it('changes nothing without an Octopus', () => {
    const result = grabWith([], noWinGrid);

    expect(result.grabs).toEqual([]);
    expect(result.field).toEqual(plainField(noWinGrid));
  });

  it('throws no tentacle when every other cell is a Scatter', () => {
    const grid = withSymbol(
      field.map((column) => column.map((): SymbolId => 'chest')),
      octopus,
      'octopus',
    );

    expect(grabWith([], grid).grabs).toEqual([{ from: octopus, hits: [] }]);
  });

  it('leaves the given field as it was', () => {
    const before = plainField(field);
    grabTentacles(before, [octopus], createRng(1), even);

    expect(before).toEqual(plainField(field));
  });

  it('grabs the same cells with the same multipliers for the same seed', () => {
    const play = () => grabTentacles(plainField(field), [octopus], createRng(99), even);

    expect(play()).toEqual(play());
  });
});
