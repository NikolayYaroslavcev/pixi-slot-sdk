import { describe, expect, it } from 'vitest';
import { paylines } from '../config/paylines';
import { paytable } from '../config/paytable';
import { evaluateLines } from './lineWins';
import { gridOf, gridWithLine, noWinGrid } from './testGrids';

const bet = 100;

describe('evaluateLines', () => {
  it('finds nothing on a field without matches', () => {
    expect(evaluateLines(noWinGrid, bet)).toEqual([]);
  });

  it('pays 3 equal symbols from the first reel by the paytable', () => {
    const grid = gridWithLine(0, ['map', 'map', 'map']);

    expect(evaluateLines(grid, bet)).toEqual([
      {
        lineIndex: 0,
        symbolId: 'map',
        count: 3,
        cells: [
          { reelIndex: 0, rowIndex: 0 },
          { reelIndex: 1, rowIndex: 0 },
          { reelIndex: 2, rowIndex: 0 },
        ],
        path: [0, 1, 2, 3, 4].map((reelIndex) => ({ reelIndex, rowIndex: 0 })),
        multiplier: 1,
        amount: 100,
      },
    ]);
  });

  it('gives the whole payline as the path to draw, beyond the matching cells', () => {
    const grid = gridWithLine(4, ['rum', 'rum', 'rum']);

    const [win] = evaluateLines(grid, bet);

    expect(win?.path?.map((cell) => cell.rowIndex)).toEqual([0, 1, 2, 1, 0]);
    expect(win?.cells).toEqual(win?.path?.slice(0, 3));
  });

  it('counts only the matches in a row from the first reel', () => {
    const grid = gridWithLine(1, ['ace', 'ace', 'ace', 'jack', 'ace']);

    const [win] = evaluateLines(grid, bet);

    expect(win?.count).toBe(3);
    expect(win?.cells).toHaveLength(3);
  });

  it('pays nothing for 2 in a row or for matches that do not start on the first reel', () => {
    expect(evaluateLines(gridWithLine(0, ['compass', 'compass']), bet)).toEqual([]);
    expect(evaluateLines(gridWithLine(0, ['jack', 'compass', 'compass', 'compass']), bet)).toEqual(
      [],
    );
  });

  it('pays the longest combination: 5 Compasses is the top line pay', () => {
    const [win] = evaluateLines(
      gridWithLine(3, ['compass', 'compass', 'compass', 'compass', 'compass']),
      bet,
    );

    expect(win).toMatchObject({ lineIndex: 3, symbolId: 'compass', count: 5 });
    expect(win?.amount).toBe(bet * paytable.compass[5]);
  });

  // On the base field a Wild can also join equal neighbours of other lines,
  // so these cases check the line under test, not the whole list.
  it('lets the Wild stand for the regular symbol of the line', () => {
    const grid = gridWithLine(4, ['anchor', 'octopus', 'anchor', 'octopus']);

    expect(evaluateLines(grid, bet)).toContainEqual(
      expect.objectContaining({ lineIndex: 4, symbolId: 'anchor', count: 4, amount: 200 }),
    );
  });

  it('pays leading Wilds as the first regular symbol after them', () => {
    // The base field has a Rum bottle on reel 4 of the top row, so the line is 4 long.
    const grid = gridWithLine(0, ['octopus', 'octopus', 'rum']);

    expect(evaluateLines(grid, bet)).toContainEqual(
      expect.objectContaining({ lineIndex: 0, symbolId: 'rum', count: 4 }),
    );
  });

  it('pays a line of only Wilds as the Compass', () => {
    const grid = gridWithLine(0, ['octopus', 'octopus', 'octopus', 'octopus', 'octopus']);

    expect(evaluateLines(grid, bet)).toContainEqual(
      expect.objectContaining({ lineIndex: 0, symbolId: 'compass', count: 5 }),
    );
  });

  it('never pays the Scatter on a line, and the Scatter breaks a line', () => {
    expect(
      evaluateLines(gridWithLine(0, ['chest', 'chest', 'chest', 'chest', 'chest']), bet),
    ).toEqual([]);
    expect(evaluateLines(gridWithLine(0, ['jack', 'chest', 'jack', 'jack']), bet)).toEqual([]);
    expect(
      evaluateLines(gridWithLine(0, ['octopus', 'octopus', 'octopus', 'chest']), bet),
    ).toContainEqual(expect.objectContaining({ lineIndex: 0, symbolId: 'compass', count: 3 }));
  });

  it('pays every winning line, even when lines share cells', () => {
    // Line 1 (top row) and line 5 (V shape) both start in the top-left cell.
    const grid = gridWithLine(4, ['rum', 'rum', 'rum'], gridWithLine(0, ['rum', 'rum', 'rum']));

    const wins = evaluateLines(grid, bet);
    const top = wins.find((win) => win.lineIndex === 0);
    const vShape = wins.find((win) => win.lineIndex === 4);

    expect(top?.count).toBe(4);
    expect(vShape?.count).toBe(3);
    expect(top?.cells[0]).toEqual(vShape?.cells[0]);
  });

  it('pays all 15 lines on a field of one symbol', () => {
    const wins = evaluateLines(gridOf('compass'), bet);

    expect(wins).toHaveLength(paylines.length);
    expect(wins.every((win) => win.count === 5 && win.amount === bet * paytable.compass[5])).toBe(
      true,
    );
  });

  it('rounds each line pay to whole minor units', () => {
    // 0.2 × 7 = 1.4 minor units.
    const [win] = evaluateLines(gridWithLine(0, ['jack', 'jack', 'jack']), 7);

    expect(win?.amount).toBe(1);
  });

  it('names the missing cell of a field that is too small', () => {
    expect(() => evaluateLines([['jack']], bet)).toThrow('no cell at reel 1, row 0');
  });
});
