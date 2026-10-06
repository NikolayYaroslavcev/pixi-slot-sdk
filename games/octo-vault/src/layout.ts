import type { HudNodeName, LayoutConfig } from 'slot-sdk';

/** Objects the layout places. Both variants must describe each of them. */
type NodeName = 'title' | 'reels' | 'freeSpinsCount' | 'freeSpinsWin' | 'bonusBuy' | HudNodeName;

const center = { x: 0.5, y: 0.5 };

/**
 * Where the scene objects go, in design coordinates of each variant.
 * Landscape: the logo left of the reels, Spin to their right, balance, bet and win in a row below.
 * Bonus Buy sits under Spin in landscape and next to it in portrait.
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
      title: { x: 270, y: 290, scale: 0.82 },
      reels: { x: 1000, y: 470, scale: 0.98, anchor: center },
      freeSpinsCount: { x: 270, y: 610 },
      freeSpinsWin: { x: 270, y: 760 },
      spinButton: { x: 1715, y: 470 },
      bonusBuy: { x: 1715, y: 720 },
      message: { x: 1000, y: 922 },
      balance: { x: 330, y: 1005 },
      bet: { x: 1000, y: 1005 },
      win: { x: 1660, y: 1005 },
    },
  },
  portrait: {
    width: 1080,
    height: 1920,
    nodes: {
      title: { x: 540, y: 185, scale: 0.75 },
      reels: { x: 540, y: 790, anchor: center },
      freeSpinsCount: { x: 145, y: 215 },
      freeSpinsWin: { x: 935, y: 215 },
      message: { x: 540, y: 1262 },
      balance: { x: 260, y: 1370, scale: 1.15 },
      win: { x: 820, y: 1370, scale: 1.15 },
      bet: { x: 540, y: 1515, scale: 1.1 },
      spinButton: { x: 540, y: 1735, scale: 1.3 },
      bonusBuy: { x: 890, y: 1735 },
    },
  },
};
