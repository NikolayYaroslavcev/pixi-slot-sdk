import type { HudNodeName, LayoutConfig } from 'slot-sdk';

/** Objects the layout places. Both variants must describe each of them. */
type NodeName =
  | 'title'
  | 'character'
  | 'reels'
  | 'freeSpinsCount'
  | 'freeSpinsWin'
  | 'bonusBuy'
  | 'info'
  | 'sound'
  | HudNodeName;

const center = { x: 0.5, y: 0.5 };

/**
 * Where the scene objects go, in design coordinates of each variant.
 * Landscape: the logo left of the reels with the octopus captain under it, Spin to their right,
 * balance, bet and win in a row below. Bonus Buy sits under Spin in landscape and next to it in
 * portrait. Free spins put their counter and series win side by side between the logo and the
 * captain in landscape, so they never cover his face; in portrait both sit on the top right of
 * the reel frame, under the logo, which there shares the top with the captain on the left.
 * The captain's origin is between his lowest tentacles: he stands on it.
 * Portrait: the reels in the upper half, the values below them and a large Spin
 * in the bottom third, where the thumb reaches it. HUD parts are centered on their origin,
 * so they need no anchor; their scale keeps touch targets large on phones.
 */
export const layout: LayoutConfig<NodeName> = {
  landscape: {
    width: 1920,
    height: 1080,
    nodes: {
      // The logo's left edge stays inside the design area, so a 4:3 screen does not cut it.
      title: { x: 290, y: 245, scale: 0.5 },
      character: { x: 300, y: 928, scale: 1.3 },
      reels: { x: 1000, y: 462, scale: 0.84, anchor: center },
      freeSpinsCount: { x: 150, y: 412, scale: 0.68 },
      freeSpinsWin: { x: 392, y: 412, scale: 0.68 },
      spinButton: { x: 1715, y: 470 },
      bonusBuy: { x: 1715, y: 720 },
      info: { x: 1715, y: 160 },
      sound: { x: 1845, y: 160 },
      message: { x: 1000, y: 918 },
      balance: { x: 330, y: 1005 },
      bet: { x: 1000, y: 1005 },
      win: { x: 1660, y: 1005 },
    },
  },
  portrait: {
    width: 1080,
    height: 1920,
    nodes: {
      title: { x: 668, y: 205, scale: 0.62 },
      character: { x: 215, y: 372, scale: 0.8 },
      reels: { x: 540, y: 790, scale: 0.9, anchor: center },
      freeSpinsCount: { x: 690, y: 392, scale: 0.68 },
      freeSpinsWin: { x: 920, y: 392, scale: 0.68 },
      message: { x: 540, y: 1262 },
      balance: { x: 260, y: 1370, scale: 1.15 },
      win: { x: 820, y: 1370, scale: 1.15 },
      bet: { x: 540, y: 1515, scale: 1.1 },
      spinButton: { x: 540, y: 1735, scale: 1.3 },
      bonusBuy: { x: 880, y: 1735, scale: 1.12 },
      info: { x: 190, y: 1735 },
      sound: { x: 1000, y: 75, scale: 0.85 },
    },
  },
};
