import { Container, Graphics, Sprite, type ColorSource } from 'pixi.js';
import type { LoadedAssets } from '../assets/LoadedAssets';
import type { World } from '../ecs/World';
import { Highlight } from '../wins/Highlight';
import { Held, type CellPosition } from './components';
import { cellCenter, type CellMetrics } from './reelGeometry';
import type { ReelGrid } from './ReelGrid';
import { showHighlight, showTexture } from './symbolLook';

interface HeldCell {
  readonly cell: CellPosition;
  readonly view: Container;
  readonly sprite: Sprite;
}

/**
 * Symbols with `Held`, drawn still in their cells above the spinning reels. Each cell has its own
 * sprite on a patch of the panel color, created once and shown only while its symbol is held:
 * the reel keeps scrolling underneath, out of sight.
 */
export class HeldSymbols {
  readonly container = new Container({ label: 'held' });
  private readonly cells: HeldCell[];

  constructor(
    private readonly world: World,
    private readonly grid: ReelGrid<string>,
    private readonly assets: LoadedAssets,
    private readonly metrics: CellMetrics & { panelColor: ColorSource },
  ) {
    const { cellWidth, cellHeight } = metrics;
    this.cells = grid.visibleCells.map((cell) => {
      const { x, y } = cellCenter(cell, metrics);
      const patch = new Graphics()
        .rect(-cellWidth / 2, -cellHeight / 2, cellWidth, cellHeight)
        .fill(metrics.panelColor);
      const sprite = new Sprite({ anchor: 0.5 });
      const view = new Container({ x, y, visible: false });
      view.addChild(patch, sprite);
      this.container.addChild(view);
      return { cell, view, sprite };
    });
  }

  update(): void {
    for (const { cell, view, sprite } of this.cells) {
      const symbol = this.grid.symbolEntity(cell);
      view.visible = this.world.has(symbol, Held);
      if (!view.visible) {
        continue;
      }
      showTexture(sprite, this.assets.symbolTexture(this.grid.symbolAt(cell)));
      showHighlight(sprite, this.world.get(symbol, Highlight), this.metrics);
    }
  }
}
