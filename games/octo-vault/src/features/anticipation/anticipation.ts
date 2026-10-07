import type { Feature, GameContext } from 'slot-sdk';
import { anticipationConfig } from '../../config/features.config';
import { reelsConfig } from '../../config/reels.config';
import { isScatter, type SymbolId } from '../../config/symbols';
import type { ReelsFeature } from '../../scene/reels';
import { AnticipationGlow } from './AnticipationGlow';
import { anticipatedReels } from './anticipatedReels';

/**
 * Suspense after two Scatters in the base game: the reels after the second one spin longer,
 * one by one, under a pulsing light. The reels land where the result says, only later; Stop
 * takes the wait back. In free spins Scatters start nothing, so there is no suspense.
 */
export function anticipation(reels: ReelsFeature): Feature {
  return {
    install(context) {
      const { spinner } = reels.parts;
      const glow = createGlow(context, reels);
      let inFreeSpins = false;
      let waiting: number[] = [];
      context.events.on('freeSpinsActive', (active) => {
        inFreeSpins = active;
      });
      context.events.on('reelsLanding', ({ columns }) => {
        waiting = inFreeSpins
          ? []
          : holdReels(columns as SymbolId[][], spinner.delayStop.bind(spinner));
      });
      context.events.on('reelStopped', ({ reelIndex }) => {
        waiting = waiting.filter((waitingReel) => waitingReel > reelIndex);
        lightNext(context, glow, waiting, reelIndex);
      });
      context.events.on('spinCompleted', () => {
        waiting = [];
        glow.hide();
      });
    },
  };
}

/** The light is one reel wide, gap included, and as tall as the field panel. */
function createGlow(context: GameContext, reels: ReelsFeature): AnticipationGlow {
  const { view } = reels.parts;
  const { cellWidth, gap } = reelsConfig.view;
  const size = { width: cellWidth + gap, height: view.container.boundsArea.height };
  return new AnticipationGlow(view, context.app.ticker, anticipationConfig.glow, size);
}

function holdReels(
  columns: SymbolId[][],
  delayStop: (reelIndex: number, ms: number) => void,
): number[] {
  const { scatters, extraMs } = anticipationConfig;
  const held = anticipatedReels(columns, isScatter, scatters);
  for (const reelIndex of held) {
    delayStop(reelIndex, extraMs);
  }
  return held;
}

/** Once the reel before the held ones has landed, the light moves to the next held reel. */
function lightNext(
  context: GameContext,
  glow: AnticipationGlow,
  waiting: number[],
  landed: number,
): void {
  const next = waiting[0];
  if (next === undefined) {
    glow.hide();
    return;
  }
  if (next === landed + 1) {
    glow.show(next);
    context.events.emit('reelAnticipated', { reelIndex: next });
  }
}
