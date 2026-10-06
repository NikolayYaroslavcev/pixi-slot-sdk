import { describe, expect, it } from 'vitest';
import { cellCenter, cellsSize } from './reelGeometry';

const metrics = { cellWidth: 200, cellHeight: 180, gap: 10 };

describe('cellsSize', () => {
  it('adds gaps only between cells', () => {
    expect(cellsSize({ reelCount: 5, rowCount: 4 }, metrics)).toEqual({
      width: 5 * 200 + 4 * 10,
      height: 4 * 180 + 3 * 10,
    });
  });
});

describe('cellCenter', () => {
  it('puts the first cell half a cell from the corner', () => {
    expect(cellCenter({ reelIndex: 0, rowIndex: 0 }, metrics)).toEqual({ x: 100, y: 90 });
  });

  it('steps by cell plus gap', () => {
    expect(cellCenter({ reelIndex: 2, rowIndex: 3 }, metrics)).toEqual({
      x: 2 * 210 + 100,
      y: 3 * 190 + 90,
    });
  });

  it('keeps the last cell inside the cells', () => {
    const size = cellsSize({ reelCount: 5, rowCount: 4 }, metrics);
    const last = cellCenter({ reelIndex: 4, rowIndex: 3 }, metrics);

    expect(last.x + metrics.cellWidth / 2).toBe(size.width);
    expect(last.y + metrics.cellHeight / 2).toBe(size.height);
  });
});
