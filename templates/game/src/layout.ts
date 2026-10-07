import type { HudNodeName, LayoutConfig } from 'slot-sdk';

/** Objects the layout places. Both variants must describe each of them. */
type NodeName = 'reels' | HudNodeName;

const center = { x: 0.5, y: 0.5 };

/**
 * Where the scene objects go, in design coordinates of each variant.
 * Landscape: Spin right of the reels, balance, bet and win in a row below.
 * Portrait: the reels in the upper half and a large Spin at the bottom, where the thumb reaches it.
 * Open the game with `?debug=layout` to see the design area and every node.
 */
export const layout: LayoutConfig<NodeName> = {
  landscape: {
    width: 1920,
    height: 1080,
    nodes: {
      reels: { x: 960, y: 450, anchor: center },
      spinButton: { x: 1600, y: 450 },
      message: { x: 960, y: 860 },
      balance: { x: 400, y: 980 },
      bet: { x: 960, y: 980 },
      win: { x: 1520, y: 980 },
    },
  },
  portrait: {
    width: 1080,
    height: 1920,
    nodes: {
      reels: { x: 540, y: 660, scale: 1.25, anchor: center },
      message: { x: 540, y: 1180 },
      balance: { x: 270, y: 1320, scale: 1.1 },
      win: { x: 810, y: 1320, scale: 1.1 },
      bet: { x: 540, y: 1480, scale: 1.1 },
      spinButton: { x: 540, y: 1720, scale: 1.2 },
    },
  },
};
