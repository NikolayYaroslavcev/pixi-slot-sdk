import {
  FieldWinView,
  HighlightSystem,
  ReelGrid,
  ReelGridView,
  ReelMotionSystem,
  type Feature,
} from 'slot-sdk';
import { reelsConfig } from './config/reels.config';
import type { SymbolId } from './config/symbols';

/**
 * The field. `ReelGrid` holds the symbol of each cell, `ReelMotionSystem` spins the reels,
 * `HighlightSystem` lights winning symbols and `ReelGridView` draws them in the `reels` layer.
 * The round flow gets the spinner, the win presentation gets the field.
 */
export function reels(): Feature {
  return {
    install(context) {
      const { size, view: viewOptions, motion, initialSymbols, strips, highlight } = reelsConfig;
      const grid = new ReelGrid<SymbolId>(context.world, size, initialSymbols);
      const spinner = new ReelMotionSystem(context.world, grid, strips, motion, context.events);
      const highlighter = new HighlightSystem(context.world, grid, highlight);
      const view = new ReelGridView(context.world, grid, context.assets, viewOptions);
      // Motion and highlight update first, so the view draws each frame's final state.
      context.world.addSystem(spinner);
      context.world.addSystem(highlighter);
      context.world.addSystem(view);
      context.layers.reels.addChild(view.container);
      context.layout.addNode('reels', view.container);
      context.round.useReels(spinner);
      context.wins.useField(new FieldWinView(context, view, highlighter));
    },
  };
}
