import { ReelGrid, ReelGridView, ReelMotionSystem, type Feature } from 'slot-sdk';
import { reelsConfig } from '../config/reels.config';
import type { SymbolId } from '../config/symbols';
import { connectDebugSpin } from './debugSpin';

/**
 * The 5 × 4 field. `ReelGrid` holds which symbol is in each cell as entities of the world,
 * `ReelMotionSystem` spins the reels, `ReelGridView` draws them in the `reels` layer.
 * The world updates the motion first, so the view draws each frame's final positions.
 */
export function reels(): Feature {
  return {
    install(context) {
      const { size, view: viewOptions, motion, initialSymbols, strips } = reelsConfig;
      const grid = new ReelGrid<SymbolId>(context.world, size, initialSymbols);
      const spinner = new ReelMotionSystem(context.world, grid, strips, motion, context.events);
      const view = new ReelGridView(context.world, grid, context.assets, viewOptions);
      context.world.addSystem(spinner);
      context.world.addSystem(view);
      context.layers.reels.addChild(view.container);
      context.layout.addNode('reels', view.container);
      connectDebugSpin(context, grid, spinner);
    },
  };
}
