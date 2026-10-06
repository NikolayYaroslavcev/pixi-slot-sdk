import {
  FieldWinView,
  HighlightSystem,
  ReelGrid,
  ReelGridView,
  ReelMotionSystem,
  type Feature,
} from 'slot-sdk';
import { reelsConfig } from '../config/reels.config';
import type { SymbolId } from '../config/symbols';

/**
 * The 5 × 4 field. `ReelGrid` holds which symbol is in each cell as entities of the world,
 * `ReelMotionSystem` spins the reels, `HighlightSystem` lights winning symbols and
 * `ReelGridView` draws them in the `reels` layer. The world updates motion and highlight first,
 * so the view draws each frame's final state.
 * The round flow gets the spinner: it starts the reels on Spin and lands them on each `reveal`.
 * The win presentation gets the field: it lights the wins and draws their lines on it.
 */
export function reels(): Feature {
  return {
    install(context) {
      const { size, view: viewOptions, motion, initialSymbols, strips } = reelsConfig;
      const grid = new ReelGrid<SymbolId>(context.world, size, initialSymbols);
      const spinner = new ReelMotionSystem(context.world, grid, strips, motion, context.events);
      const highlight = new HighlightSystem(context.world, grid, reelsConfig.highlight);
      const view = new ReelGridView(context.world, grid, context.assets, viewOptions);
      context.world.addSystem(spinner);
      context.world.addSystem(highlight);
      context.world.addSystem(view);
      context.layers.reels.addChild(view.container);
      context.layout.addNode('reels', view.container);
      context.round.useReels(spinner);
      context.wins.useField(new FieldWinView(context, view, highlight));
    },
  };
}
