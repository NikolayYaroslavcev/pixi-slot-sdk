import { BlurFilter, Container, Graphics, Rectangle, Sprite, type ColorSource } from 'pixi.js';
import type { LoadedAssets } from '../assets/LoadedAssets';
import type { System, World } from '../ecs/World';
import { ReelMotion, ReelStrip } from './components';
import { cellsSize, reelCenterX, rowCenterY, type CellMetrics } from './reelGeometry';
import type { ReelGrid } from './ReelGrid';
import type { ReelMotionData } from './reelMotion';
import { poolSlot, slotSymbol, type FieldColumn } from './reelSlots';

/** Vertical blur of a moving reel, growing with its speed. Speeds are in symbols per second. */
export interface MotionBlurOptions {
  /** Below this speed there is no blur, so a reel near its stop is sharp. */
  fromSpeed: number;
  /** At this speed and above the blur is at full `strength`. */
  fullSpeed: number;
  /** Blur strength at full speed, in design pixels: it shrinks with the field on a small screen. */
  strength: number;
  /** Blur passes. More is smoother and slower. */
  quality: number;
}

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
  readonly blur: BlurFilter;
  readonly field: FieldColumn;
  readonly motion: ReelMotionData;
  readonly strip: readonly string[];
}

/**
 * Draws the reels of a `ReelGrid` on a panel the size of the field.
 *
 * Each reel has a fixed pool of `rows + 2` sprites: the visible rows plus one above and one
 * below for the symbols that are scrolling in and out. Every frame each sprite is placed
 * by the reel's `ReelMotion` and gets the texture of the slot it shows now. A mask hides
 * the spare sprites. Sprites live here, not in components: the world stays free of Pixi.
 *
 * Create it after `ReelMotionSystem`, which gives the reels their strip and motion.
 */
export class ReelGridView implements System {
  /** Add it to the `reels` layer and register it with the layout. */
  readonly container = new Container({ label: 'reels' });
  private readonly columns: ReelColumn[];

  constructor(
    private readonly world: World,
    grid: ReelGrid<string>,
    private readonly assets: LoadedAssets,
    private readonly options: ReelGridViewOptions,
  ) {
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
    symbols.addChild(...this.columns.map((column) => column.container));
    // Fixed bounds: the layout anchors the field by its panel, whatever the symbols do.
    this.container.boundsArea = new Rectangle(0, 0, width, height);
    this.container.addChild(panel, symbols);
    // Draw the field now, so it is complete before the first frame.
    this.update();
  }

  update(): void {
    // Plain loops: this runs every frame and creates nothing.
    for (const column of this.columns) {
      this.drawColumn(column);
    }
  }

  private drawColumn(column: ReelColumn): void {
    const { motion, sprites } = column;
    for (let poolIndex = 0; poolIndex < sprites.length; poolIndex += 1) {
      const sprite = sprites[poolIndex];
      if (!sprite) {
        continue;
      }
      const slot = poolSlot(poolIndex, motion.position, sprites.length);
      sprite.y = rowCenterY(slot + motion.position, this.options);
      const symbolId = slotSymbol(slot, motion, column.strip, column.field);
      this.showSymbol(sprite, symbolId);
    }
    this.blurBySpeed(column.blur, motion.speed);
  }

  private showSymbol(sprite: Sprite, symbolId: string): void {
    const texture = this.assets.symbolTexture(symbolId);
    if (sprite.texture === texture) {
      return;
    }
    sprite.texture = texture;
    sprite.setSize(this.options.cellWidth, this.options.cellHeight);
  }

  private blurBySpeed(blur: BlurFilter, speed: number): void {
    const { fromSpeed, fullSpeed, strength } = this.options.motionBlur;
    const amount = Math.min(
      Math.max((Math.abs(speed) - fromSpeed) / (fullSpeed - fromSpeed), 0),
      1,
    );
    // A disabled filter is skipped entirely, so a reel at rest costs nothing extra.
    blur.enabled = amount > 0;
    // A filter blurs in screen pixels. The world scale of the field turns design pixels into them.
    const screenScale = Math.abs(this.container.worldTransform.d);
    blur.strengthY = strength * amount * screenScale;
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
    const { quality } = this.options.motionBlur;
    const blur = new BlurFilter({ strengthX: 0, strengthY: 0, quality });
    blur.enabled = false;
    const container = new Container({ label: `reel ${String(reelIndex)}`, filters: [blur] });
    container.addChild(...sprites);
    return {
      container,
      sprites,
      blur,
      motion,
      strip: strip.symbols,
      field: fieldColumn(grid, reelIndex),
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
