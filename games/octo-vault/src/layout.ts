import type { LayoutConfig } from 'slot-sdk';

/** Objects the layout places. Both variants must describe each of them. */
type NodeName = 'symbols' | 'demo';

const center = { x: 0.5, y: 0.5 };

/**
 * Where the scene objects go, in design coordinates of each variant.
 * Landscape puts the demo next to the symbols. Portrait stacks them and keeps
 * the bottom of the screen free for the HUD.
 */
export const layout: LayoutConfig<NodeName> = {
  landscape: {
    width: 1920,
    height: 1080,
    nodes: {
      symbols: { x: 520, y: 540, anchor: center },
      // No anchor: the demo swings, and its origin is the center of the swing.
      demo: { x: 1400, y: 480 },
    },
  },
  portrait: {
    width: 1080,
    height: 1920,
    nodes: {
      symbols: { x: 540, y: 640, scale: 1.1, anchor: center },
      demo: { x: 540, y: 1300, scale: 1.25 },
    },
  },
};
