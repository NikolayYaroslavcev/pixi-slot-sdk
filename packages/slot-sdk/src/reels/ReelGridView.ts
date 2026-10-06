import { Container, Graphics, Rectangle, Sprite, type ColorSource } from 'pixi.js';
import type { LoadedAssets } from '../assets/LoadedAssets';
import type { Entity, System, World } from '../ecs/World';
import { GridPosition, SymbolKind } from './components';
import { cellCenter, cellsSize, type CellMetrics } from './reelGeometry';
import type { ReelGridSize } from './ReelGrid';

/** How the field looks. Sizes are in design coordinates. */
export interface ReelGridViewOptions extends CellMetrics {
  /** Space between the panel edge and the cells. */
  padding: number;
  panelColor: ColorSource;
}

/**
 * Draws every symbol entity of the world as a sprite in its cell, on a panel the size of the field.
 *
 * Sprites live here, not in components: the world and `ReelGrid` stay free of Pixi and are tested
 * in Node. Each `update` brings the sprites in line with the entities: a new entity gets
 * a sprite, a changed `SymbolKind` swaps the texture, a destroyed entity loses its sprite.
 */
export class ReelGridView implements System {
  /** Add it to the `reels` layer and register it with the layout. */
  readonly container = new Container({ label: 'reels' });
  private readonly symbols = new Container({ label: 'symbols' });
  private readonly sprites = new Map<Entity, Sprite>();

  constructor(
    private readonly world: World,
    private readonly assets: LoadedAssets,
    size: ReelGridSize,
    private readonly options: ReelGridViewOptions,
  ) {
    const cells = cellsSize(size, options);
    const width = cells.width + options.padding * 2;
    const height = cells.height + options.padding * 2;
    const panel = new Graphics().rect(0, 0, width, height).fill(options.panelColor);
    this.symbols.position.set(options.padding);
    // Fixed bounds: the layout anchors the field by its panel, whatever the symbols do.
    this.container.boundsArea = new Rectangle(0, 0, width, height);
    this.container.addChild(panel, this.symbols);
    // Draw the field now, so it is complete before the first frame.
    this.update();
  }

  update(): void {
    for (const entity of this.world.query(GridPosition, SymbolKind)) {
      this.syncSprite(entity);
    }
    this.removeDestroyedSprites();
  }

  private syncSprite(entity: Entity): void {
    const position = this.world.get(entity, GridPosition);
    const kind = this.world.get(entity, SymbolKind);
    if (!position || !kind) {
      return;
    }
    const sprite = this.sprites.get(entity) ?? this.createSprite(entity);
    const texture = this.assets.symbolTexture(kind.symbolId);
    if (sprite.texture !== texture) {
      sprite.texture = texture;
      sprite.setSize(this.options.cellWidth, this.options.cellHeight);
    }
    const center = cellCenter(position, this.options);
    sprite.position.set(center.x, center.y);
  }

  private createSprite(entity: Entity): Sprite {
    const sprite = new Sprite({ anchor: 0.5 });
    this.symbols.addChild(sprite);
    this.sprites.set(entity, sprite);
    return sprite;
  }

  private removeDestroyedSprites(): void {
    for (const [entity, sprite] of this.sprites) {
      if (this.world.isAlive(entity)) {
        continue;
      }
      // The texture is shared by every sprite of the symbol, so only the sprite goes.
      sprite.destroy();
      this.sprites.delete(entity);
    }
  }
}
