import { Container, Graphics, Rectangle, Sprite, type ColorSource } from 'pixi.js';
import type { LoadedAssets } from '../assets/LoadedAssets';
import type { System, World } from '../ecs/World';
import { Highlight, type HighlightData } from '../wins/Highlight';
import { ReelMotion, ReelStrip, type CellPosition } from './components';
import { HeldSymbols } from './HeldSymbols';
import { motionBlurLevel, MotionBlurTextures, type MotionBlurOptions } from './motionBlur';
import { cellCenter, cellsSize, reelCenterX, rowCenterY, type CellMetrics } from './reelGeometry';
import type { ReelGrid } from './ReelGrid';
import type { ReelMotionData } from './reelMotion';
import { poolSlot, slotSymbol, type FieldColumn } from './reelSlots';
import { showHighlight, showTexture } from './symbolLook';

export type { MotionBlurOptions } from './motionBlur';

/** How the field looks. Sizes are in design coordinates. */
export interface ReelGridViewOptions extends CellMetrics {
  /** Space between the panel edge and the cells. */
  padding: number;
  panelColor: ColorSource;
  motionBlur: MotionBlurOptions;
}

/** Display objects of one reel. They are created once and reused for every symbol that passes. */
interface ReelColumn {
  readonly container: Container;
  readonly sprites: readonly Sprite[];
  readonly field: FieldColumn;
  readonly motion: ReelMotionData;
  readonly strip: readonly string[];
  /** Reused to look up a cell of this reel every frame without creating objects. */
  readonly cell: CellPosition;
}

/**
 * Draws the reels of a `ReelGrid` on a panel the size of the field.
 *
 * Each reel has a fixed pool of `rows + 2` sprites: the visible rows plus one above and one
 * below for the symbols that are scrolling in and out. Every frame each sprite is placed
 * by the reel's `ReelMotion` and gets the texture of the slot it shows now. A mask hides
 * the spare sprites. Sprites live here, not in components: the world stays free of Pixi.
 * A fast reel shows blurred copies of its symbols (`MotionBlurTextures`), chosen by its speed.
 * A symbol with a `Highlight` is drawn with its brightness and size. A symbol with `Held`
 * is drawn still in its cell, above its spinning reel (`HeldSymbols`).
 *
 * Create it after `ReelMotionSystem`, which gives the reels their strip and motion.
 */
export class ReelGridView implements System {
  /** Add it to the `reels` layer and register it with the layout. */
  readonly container = new Container({ label: 'reels' });
  private readonly columns: ReelColumn[];
  private readonly held: HeldSymbols;
  private readonly blurred: MotionBlurTextures;

  constructor(
    private readonly world: World,
    private readonly grid: ReelGrid<string>,
    private readonly assets: LoadedAssets,
    private readonly options: ReelGridViewOptions,
  ) {
    this.blurred = new MotionBlurTextures(options.motionBlur, options.cellHeight);
    const cells = cellsSize(grid.size, options);
    const width = cells.width + options.padding * 2;
    const height = cells.height + options.padding * 2;
    const panel = new Graphics().rect(0, 0, width, height).fill(options.panelColor);
    const symbols = new Container({ label: 'symbols', x: options.padding, y: options.padding });
    // The mask is a child of the field, so it follows every layout change of the field.
    const mask = new Graphics().rect(0, 0, cells.width, cells.height).fill(0xffffff);
    symbols.addChild(mask);
    symbols.mask = mask;
    this.columns = Array.from({ length: grid.size.reelCount }, (_reel, reelIndex) =>
      this.createColumn(grid, reelIndex),
    );
    this.prepareBlur();
    this.held = new HeldSymbols(world, grid, assets, options);
    symbols.addChild(...this.columns.map((column) => column.container), this.held.container);
    // Fixed bounds: the layout anchors the field by its panel, whatever the symbols do.
    this.container.boundsArea = new Rectangle(0, 0, width, height);
    this.container.addChild(panel, symbols);
    // Draw the field now, so it is complete before the first frame.
    this.update();
  }

  /** Height of a cell, in the coordinates of `container`. */
  get cellHeight(): number {
    return this.options.cellHeight;
  }

  /** Center of a cell in the coordinates of `container`. */
  cellCenter(position: CellPosition): { x: number; y: number } {
    const center = cellCenter(position, this.options);
    return { x: center.x + this.options.padding, y: center.y + this.options.padding };
  }

  /** Blurred copies of every symbol on the strips, drawn while the game loads. */
  private prepareBlur(): void {
    const symbolIds = new Set(this.columns.flatMap((column) => column.strip));
    for (const symbolId of symbolIds) {
      this.blurred.prepare(this.assets.symbolTexture(symbolId));
    }
  }

  update(): void {
    // Plain loops: this runs every frame and creates nothing.
    for (const column of this.columns) {
      this.drawColumn(column);
    }
    this.held.update();
  }

  private drawColumn(column: ReelColumn): void {
    const { motion, sprites } = column;
    const blurLevel = motionBlurLevel(motion.speed, this.options.motionBlur);
    for (let poolIndex = 0; poolIndex < sprites.length; poolIndex += 1) {
      const sprite = sprites[poolIndex];
      if (!sprite) {
        continue;
      }
      const slot = poolSlot(poolIndex, motion.position, sprites.length);
      sprite.y = rowCenterY(slot + motion.position, this.options);
      const symbolId = slotSymbol(slot, motion, column.strip, column.field);
      showTexture(sprite, this.blurred.get(this.assets.symbolTexture(symbolId), blurLevel));
      showHighlight(sprite, this.highlightAt(column, slot - motion.restSlot), this.options);
    }
  }

  /** `rowIndex` is the field row the sprite shows; outside the field there is no highlight. */
  private highlightAt(column: ReelColumn, rowIndex: number): HighlightData | undefined {
    if (rowIndex < 0 || rowIndex >= column.field.rowCount) {
      return undefined;
    }
    column.cell.rowIndex = rowIndex;
    return this.world.get(this.grid.symbolEntity(column.cell), Highlight);
  }

  private createColumn(grid: ReelGrid<string>, reelIndex: number): ReelColumn {
    const reel = grid.reelEntity(reelIndex);
    const motion = this.world.get(reel, ReelMotion);
    const strip = this.world.get(reel, ReelStrip);
    if (!motion || !strip) {
      throw new Error(
        `ReelGridView: reel ${String(reelIndex)} has no motion, create ReelMotionSystem first`,
      );
    }
    const x = reelCenterX(reelIndex, this.options);
    const sprites = Array.from(
      { length: grid.size.rowCount + 2 },
      () => new Sprite({ anchor: 0.5, x }),
    );
    const container = new Container({ label: `reel ${String(reelIndex)}` });
    container.addChild(...sprites);
    return {
      container,
      sprites,
      motion,
      strip: strip.symbols,
      field: fieldColumn(grid, reelIndex),
      cell: { reelIndex, rowIndex: 0 },
    };
  }
}

/** Reads one reel of the field. One cell object is reused, so reading every frame creates nothing. */
function fieldColumn(grid: ReelGrid<string>, reelIndex: number): FieldColumn {
  const cell = { reelIndex, rowIndex: 0 };
  return {
    rowCount: grid.size.rowCount,
    symbolAt(rowIndex) {
      cell.rowIndex = rowIndex;
      return grid.symbolAt(cell);
    },
  };
}
