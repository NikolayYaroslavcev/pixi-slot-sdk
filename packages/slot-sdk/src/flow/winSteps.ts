import type { EventBus } from '../core/EventBus';
import type { GameEvents } from '../core/GameEvents';
import type { GameModel } from '../core/GameModel';
import type { TotalWinStep, WinsStep } from '../math/round';
import type { StepRegistry } from './RoundPlayer';

/** How long the win steps stay on screen, in milliseconds. Set by the game. */
export interface PresentationTiming {
  /** The `wins` step. */
  winsMs: number;
  /** The `totalWin` step, when the round won something. */
  totalWinMs: number;
}

/** Waits `ms` on the game clock, or less if `skip` is aborted. */
export type Pause = (ms: number, skip: AbortSignal) => Promise<void>;

export interface WinStepsDependencies {
  events: EventBus<GameEvents>;
  model: GameModel;
  pause: Pause;
  timing: PresentationTiming;
}

/**
 * Registers the SDK handlers of `wins` and `totalWin`. They announce the result and hold
 * it on screen for a while; how the result looks is up to whoever listens to the events.
 */
export function registerWinSteps(registry: StepRegistry, dependencies: WinStepsDependencies): void {
  const { events, model, pause, timing } = dependencies;
  registry.register<WinsStep>('wins', async (step, skip) => {
    events.emit('winsShown', { wins: step.wins, amount: step.amount });
    await pause(timing.winsMs, skip);
  });
  registry.register<TotalWinStep>('totalWin', async (step, skip) => {
    model.setLastWin(step.amount);
    // A round without a win has nothing to hold on screen.
    if (step.amount > 0) {
      await pause(timing.totalWinMs, skip);
    }
  });
}
