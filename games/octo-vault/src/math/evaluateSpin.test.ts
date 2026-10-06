import { describe, expect, it } from 'vitest';
import type { SymbolGrid } from '../config/symbols';
import { evaluateSpin } from './evaluateSpin';
import { findScatters } from './findScatters';
import { gridWithLine, noWinGrid } from './testGrids';

describe('findScatters', () => {
  it('finds Scatters in any position, reel by reel', () => {
    const grid: SymbolGrid = noWinGrid.map((column, reelIndex) =>
      reelIndex === 1 || reelIndex === 4 ? ['key', ...column.slice(1)] : column,
    );

    expect(findScatters(grid)).toEqual([
      { reelIndex: 1, rowIndex: 0 },
      { reelIndex: 4, rowIndex: 0 },
    ]);
  });

  it('finds none on a field without Scatters', () => {
    expect(findScatters(noWinGrid)).toEqual([]);
  });
});

describe('evaluateSpin', () => {
  it('is a zero win on a field without matches', () => {
    expect(evaluateSpin(noWinGrid, 100)).toEqual({ wins: [], totalWin: 0, scatters: [] });
  });

  it('sums the wins of every line into the total win', () => {
    const grid = gridWithLine(
      3,
      ['fish', 'fish', 'fish'],
      gridWithLine(0, ['crown', 'crown', 'crown']),
    );

    const outcome = evaluateSpin(grid, 100);

    expect(outcome.wins.map((win) => win.amount)).toEqual([150, 30]);
    expect(outcome.totalWin).toBe(180);
  });

  it('reports Scatters together with line wins', () => {
    const grid = gridWithLine(
      1,
      ['key', 'shell', 'key', 'pearl', 'key'],
      gridWithLine(0, ['chest', 'chest', 'chest']),
    );

    const outcome = evaluateSpin(grid, 100);

    expect(outcome.scatters).toHaveLength(3);
    expect(outcome.totalWin).toBe(100);
  });

  it('gives the same outcome for the same field', () => {
    const grid = gridWithLine(0, ['anchor', 'octopus', 'anchor']);

    expect(evaluateSpin(grid, 100)).toEqual(evaluateSpin(grid, 100));
  });
});
