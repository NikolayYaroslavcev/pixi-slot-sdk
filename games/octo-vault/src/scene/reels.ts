import { Assets, NineSliceSprite, type Texture } from 'pixi.js';
import {
  FieldWinView,
  HighlightSystem,
  ReelGrid,
  ReelGridView,
  ReelMotionSystem,
  type Feature,
} from 'slot-sdk';
import { reelsConfig } from '../config/reels.config';
import { reelFrameLook } from '../config/scenery.config';
import type { SymbolId } from '../config/symbols';

/** The parts of the field that the game's mechanics work with. */
export interface FieldParts {
  readonly grid: ReelGrid<SymbolId>;
  readonly view: ReelGridView;
  readonly spinner: ReelMotionSystem<SymbolId>;
  readonly highlight: HighlightSystem;
}

/** The reels feature. Features installed after it reach the field through `parts`. */
export interface ReelsFeature extends Feature {
  readonly parts: FieldParts;
}

/**
 * The 5 × 4 field. `ReelGrid` holds which symbol is in each cell as entities of the world,
 * `ReelMotionSystem` spins the reels, `HighlightSystem` lights winning symbols and
 * `ReelGridView` draws them in the `reels` layer, inside the frame. The world updates motion and highlight first,
 * so the view draws each frame's final state.
 * The round flow gets the spinner: it starts the reels on Spin and lands them on each `reveal`.
 * The win presentation gets the field: it lights the wins and draws their lines on it.
 */
export function reels(): ReelsFeature {
  let parts: FieldParts | null = null;
  return {
    get parts(): FieldParts {
      if (!parts) {
        throw new Error('reels: install the reels feature before the features that use the field');
      }
      return parts;
    },
    install(context) {
      const { size, view: viewOptions, motion, initialSymbols, strips } = reelsConfig;
      const grid = new ReelGrid<SymbolId>(context.world, size, initialSymbols);
      const spinner = new ReelMotionSystem(context.world, grid, strips, motion, context.events);
      const highlight = new HighlightSystem(context.world, grid, reelsConfig.highlight);
      const view = new ReelGridView(context.world, grid, context.assets, viewOptions);
      context.world.addSystem(spinner);
      context.world.addSystem(highlight);
      context.world.addSystem(view);
      // The frame goes over the symbols: its dividers sit in the gaps between reels and its
      // shade darkens the top and bottom rows a little, as if the reels were deep in the frame.
      view.container.addChild(createFrame(view));
      context.layers.reels.addChild(view.container);
      context.layout.addNode('reels', view.container);
      context.round.useReels(spinner);
      context.wins.useField(new FieldWinView(context, view, highlight));
      parts = { grid, view, spinner, highlight };
    },
  };
}

/**
 * The frame stretched around the field panel: its window lies exactly over the panel. The window
 * is as far from each edge of the texture, so with the border drawn `thickness` times its size
 * the middle of the nine-slice stretches to the panel.
 */
function createFrame(view: ReelGridView): NineSliceSprite {
  const texture = Assets.get<Texture>('reelFrame');
  const { window, corner, thickness } = reelFrameLook;
  const panel = view.container.boundsArea as { width: number; height: number };
  const border = { x: texture.width - window.width, y: texture.height - window.height };
  const frame = new NineSliceSprite({
    texture,
    leftWidth: corner,
    rightWidth: corner,
    topHeight: corner,
    bottomHeight: corner,
    width: (panel.width + border.x * thickness) / thickness,
    height: (panel.height + border.y * thickness) / thickness,
  });
  frame.scale.set(thickness);
  frame.position.set(-window.x * thickness, -window.y * thickness);
  return frame;
}
