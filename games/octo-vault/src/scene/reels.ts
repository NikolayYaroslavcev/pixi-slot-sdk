import { ReelGrid, ReelGridView, type Feature } from 'slot-sdk';
import { reelsConfig } from '../config/reels.config';
import type { SymbolId } from '../config/symbols';

/**
 * The 5 × 4 field. `ReelGrid` holds which symbol is in each cell as entities of the world,
 * `ReelGridView` draws them in the `reels` layer and is updated by the world every frame.
 */
export function reels(): Feature {
  return {
    install(context) {
      const { size, view: viewOptions, initialSymbols } = reelsConfig;
      const grid = new ReelGrid<SymbolId>(context.world, size, initialSymbols);
      const view = new ReelGridView(context.world, context.assets, grid.size, viewOptions);
      context.world.addSystem(view);
      context.layers.reels.addChild(view.container);
      context.layout.addNode('reels', view.container);
    },
  };
}
