import type { Ticker } from 'pixi.js';

// Below 10 fps the ticker stops reporting real frame time: one frame never advances
// animations by more than 100 ms. Above it, animations keep real time even on a slow phone.
const MIN_FPS = 10;

/**
 * Makes the ticker safe for animations: frame time is capped, and the ticker pauses
 * while the tab is hidden. `Ticker.start()` resets its clock, so when the tab comes back
 * animations continue from where they stopped instead of jumping to the end.
 */
export function configureTicker(ticker: Ticker): void {
  ticker.minFPS = MIN_FPS;
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      ticker.stop();
      return;
    }
    ticker.start();
  });
}
