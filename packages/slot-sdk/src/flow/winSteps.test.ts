import { describe, expect, it, vi } from 'vitest';
import { EventBus } from '../core/EventBus';
import type { GameEvents } from '../core/GameEvents';
import { GameModel } from '../core/GameModel';
import type { TotalWinStep, WinsStep } from '../math/round';
import { RoundPlayer } from './RoundPlayer';
import { registerWinSteps, type Pause } from './winSteps';

const timing = { winsMs: 1200, totalWinMs: 800 };

function createPlayer() {
  const events = new EventBus<GameEvents>();
  const model = new GameModel(events, { balance: 1000, bet: 100 });
  const pause = vi.fn<Pause>(() => Promise.resolve());
  const player = new RoundPlayer();
  registerWinSteps(player, { events, model, pause, timing });
  return { events, model, pause, player };
}

const winsStep: WinsStep = {
  type: 'wins',
  wins: [{ cells: [{ reelIndex: 0, rowIndex: 1 }], amount: 50 }],
  amount: 50,
};

describe('registerWinSteps', () => {
  it('announces the wins and holds them on screen', async () => {
    const { events, pause, player } = createPlayer();
    const shown = vi.fn();
    events.on('winsShown', shown);

    await player.play([winsStep]);

    expect(shown).toHaveBeenCalledExactlyOnceWith({ wins: winsStep.wins, amount: 50 });
    expect(pause).toHaveBeenCalledExactlyOnceWith(1200, expect.any(AbortSignal));
  });

  it('puts the total win into the model and holds it on screen', async () => {
    const { model, pause, player } = createPlayer();
    const step: TotalWinStep = { type: 'totalWin', amount: 250 };

    await player.play([step]);

    expect(model.lastWin).toBe(250);
    expect(pause).toHaveBeenCalledExactlyOnceWith(800, expect.any(AbortSignal));
  });

  it('does not wait after a round without a win', async () => {
    const { model, pause, player } = createPlayer();
    const step: TotalWinStep = { type: 'totalWin', amount: 0 };

    await player.play([step]);

    expect(model.lastWin).toBe(0);
    expect(pause).not.toHaveBeenCalled();
  });

  it('passes the skip signal to the pause', async () => {
    const { pause, player } = createPlayer();
    pause.mockImplementation(
      (_ms, skip) =>
        new Promise((resolve) => {
          skip.addEventListener('abort', () => {
            resolve();
          });
        }),
    );

    const playing = player.play([winsStep]);
    player.skip();

    await expect(playing).resolves.toBeUndefined();
  });
});
