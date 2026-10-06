import type { HudNodeName, LayoutConfig } from 'slot-sdk';

/** Objects the layout places. Both variants must describe each of them. */
type NodeName = 'title' | 'reels' | 'freeSpinsCount' | 'freeSpinsWin' | HudNodeName;

const center = { x: 0.5, y: 0.5 };

/**
 * Where the scene objects go, in design coordinates of each variant.
 * Landscape: the reels in the middle, Spin to their right, balance, bet and win in a row below.
 * Free spins put their counter and series win left of the reels in landscape and on both sides
 * of the title in portrait.
 * Portrait: the reels in the upper half, the values below them and a large Spin
 * in the bottom third, where the thumb reaches it. HUD parts are centered on their origin,
 * so they need no anchor; their scale keeps touch targets large on phones.
 */
export const layout: LayoutConfig<NodeName> = {
  landscape: {
    width: 1920,
    height: 1080,
    nodes: {
      title: { x: 960, y: 74, anchor: center },
      reels: { x: 960, y: 515, scale: 0.94, anchor: center },
      freeSpinsCount: { x: 255, y: 440 },
      freeSpinsWin: { x: 255, y: 590 },
      spinButton: { x: 1665, y: 515 },
      message: { x: 960, y: 918 },
      balance: { x: 330, y: 1005 },
      bet: { x: 960, y: 1005 },
      win: { x: 1590, y: 1005 },
    },
  },
  portrait: {
    width: 1080,
    height: 1920,
    nodes: {
      title: { x: 540, y: 200, anchor: center },
      reels: { x: 540, y: 720, scale: 1.05, anchor: center },
      freeSpinsCount: { x: 145, y: 215 },
      freeSpinsWin: { x: 935, y: 215 },
      message: { x: 540, y: 1215 },
      balance: { x: 260, y: 1335, scale: 1.15 },
      win: { x: 820, y: 1335, scale: 1.15 },
      bet: { x: 540, y: 1485, scale: 1.1 },
      spinButton: { x: 540, y: 1720, scale: 1.3 },
    },
  },
};
