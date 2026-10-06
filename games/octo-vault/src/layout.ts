import type { LayoutConfig } from 'slot-sdk';

/** Objects the layout places. Both variants must describe each of them. */
type NodeName = 'title' | 'reels';

const center = { x: 0.5, y: 0.5 };

/**
 * Where the scene objects go, in design coordinates of each variant.
 * Landscape keeps a strip below the reels for the HUD. Portrait puts the reels
 * in the upper half and leaves the lower part for the character and the HUD.
 */
export const layout: LayoutConfig<NodeName> = {
  landscape: {
    width: 1920,
    height: 1080,
    nodes: {
      title: { x: 960, y: 74, anchor: center },
      reels: { x: 960, y: 540, anchor: center },
    },
  },
  portrait: {
    width: 1080,
    height: 1920,
    nodes: {
      title: { x: 540, y: 220, anchor: center },
      reels: { x: 540, y: 740, scale: 1.05, anchor: center },
    },
  },
};
