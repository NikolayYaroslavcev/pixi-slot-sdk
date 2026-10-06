import type { Entity, World } from '../ecs/World';
import { GridPosition, Reel, SymbolKind, type CellPosition } from './components';

/** Number of reels and of visible rows on each of them. */
export interface ReelGridSize {
  reelCount: number;
  rowCount: number;
}

/**
 * The visible field as entities: a `Reel` entity per reel and a symbol entity per cell,
 * with `GridPosition` and `SymbolKind`. Pure data: drawing it is `ReelGridView`'s job.
 *
 * The grid is the one place that answers "which symbol is in this cell".
 * Games read and change cells through it, never by searching the world.
 */
export class ReelGrid<SymbolId extends string> {
  readonly size: Readonly<ReelGridSize>;
  private readonly reels: Entity[] = [];
  /** Symbol entities by `[reelIndex][rowIndex]`. */
  private readonly cells: Entity[][] = [];

  /** `columns` are the symbols the field starts with, one array per reel from the top. */
  constructor(
    private readonly world: World,
    size: ReelGridSize,
    columns: readonly (readonly SymbolId[])[],
  ) {
    assertGrid(size, columns);
    this.size = { ...size };
    columns.forEach((column, reelIndex) => {
      const reel = world.createEntity();
      world.add(reel, Reel, { reelIndex });
      this.reels.push(reel);
      this.cells.push(
        column.map((symbolId, rowIndex) => this.createSymbol({ reelIndex, rowIndex }, symbolId)),
      );
    });
  }

  /** Every visible cell, reel by reel, top to bottom. */
  get visibleCells(): CellPosition[] {
    return this.cells.flatMap((column, reelIndex) =>
      column.map((_symbol, rowIndex) => ({ reelIndex, rowIndex })),
    );
  }

  /** The symbols of the field, one array per reel from the top. */
  get columns(): SymbolId[][] {
    return this.cells.map((column, reelIndex) =>
      column.map((_symbol, rowIndex) => this.symbolAt({ reelIndex, rowIndex })),
    );
  }

  reelEntity(reelIndex: number): Entity {
    const reel = this.reels[reelIndex];
    if (reel === undefined) {
      throw new Error(`ReelGrid: reel ${String(reelIndex)} is outside the field`);
    }
    return reel;
  }

  /** The symbol entity in the cell. Game components such as a multiplier go on it. */
  symbolEntity(position: CellPosition): Entity {
    const symbol = this.cells[position.reelIndex]?.[position.rowIndex];
    if (symbol === undefined) {
      throw new Error(`ReelGrid: cell ${formatCell(position)} is outside the field`);
    }
    return symbol;
  }

  symbolAt(position: CellPosition): SymbolId {
    // Only this class writes `SymbolKind` of its cells, always with a `SymbolId`.
    return this.symbolKind(position).symbolId as SymbolId;
  }

  /** Changes the symbol shown in the cell. The entity and its other components stay. */
  setSymbol(position: CellPosition, symbolId: SymbolId): void {
    this.symbolKind(position).symbolId = symbolId;
  }

  /**
   * Puts a new symbol entity into the cell. The old one is destroyed with every component
   * a game added to it, so nothing carries over to the new symbol.
   */
  replaceSymbol(position: CellPosition, symbolId: SymbolId): Entity {
    const column = this.cells[position.reelIndex];
    this.world.destroyEntity(this.symbolEntity(position));
    const symbol = this.createSymbol(position, symbolId);
    column?.splice(position.rowIndex, 1, symbol);
    return symbol;
  }

  private createSymbol(position: CellPosition, symbolId: SymbolId): Entity {
    const symbol = this.world.createEntity();
    this.world.add(symbol, GridPosition, { ...position });
    this.world.add(symbol, SymbolKind, { symbolId });
    return symbol;
  }

  private symbolKind(position: CellPosition): { symbolId: string } {
    const kind = this.world.get(this.symbolEntity(position), SymbolKind);
    if (!kind) {
      throw new Error(`ReelGrid: cell ${formatCell(position)} has no SymbolKind`);
    }
    return kind;
  }
}

function assertGrid(size: ReelGridSize, columns: readonly (readonly string[])[]): void {
  const { reelCount, rowCount } = size;
  if (
    !Number.isInteger(reelCount) ||
    !Number.isInteger(rowCount) ||
    reelCount < 1 ||
    rowCount < 1
  ) {
    throw new Error(
      `ReelGrid: size must be whole numbers from 1, got ${String(reelCount)} × ${String(rowCount)}`,
    );
  }
  if (columns.length !== reelCount) {
    throw new Error(
      `ReelGrid: expected ${String(reelCount)} reels of symbols, got ${String(columns.length)}`,
    );
  }
  const wrongReel = columns.findIndex((column) => column.length !== rowCount);
  if (wrongReel !== -1) {
    throw new Error(`ReelGrid: reel ${String(wrongReel)} must have ${String(rowCount)} symbols`);
  }
}

function formatCell(position: CellPosition): string {
  return `reel ${String(position.reelIndex)}, row ${String(position.rowIndex)}`;
}
