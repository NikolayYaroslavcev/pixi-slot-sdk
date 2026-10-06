import { describe, expect, it, vi } from 'vitest';
import { EventBus } from '../core/EventBus';
import type { GameEvents } from '../core/GameEvents';
import { GameModel } from '../core/GameModel';
import type { RoundResult } from '../math/round';
import { RoundFlow } from './RoundFlow';
import { createRoundFlow, grid, wonRound } from './roundFlowTestKit';
import { RoundPlayer } from './RoundPlayer';

/** A result that arrives when the test calls `answer`. */
function createPendingResult() {
  let answer: (result: RoundResult) => void = () => undefined;
  const play = () =>
    new Promise<RoundResult>((resolve) => {
      answer = resolve;
    });
  return {
    play,
    answer: (result: RoundResult) => {
      answer(result);
    },
  };
}

function silenceConsoleError() {
  return vi.spyOn(console, 'error').mockImplementation(() => undefined);
}

describe('RoundFlow', () => {
  it('plays a round: idle → spinning → presenting → idle', async () => {
    const { flow, reels, states } = createRoundFlow();

    await flow.spin();

    expect(states).toEqual(['spinning', 'presenting', 'idle']);
    expect(reels.target).toEqual(grid);
    expect(flow.state).toBe('idle');
  });

  it('takes the bet at Spin and settles the balance and win from the result at the end', async () => {
    const pending = createPendingResult();
    const { flow, model, resultSource } = createRoundFlow(pending.play);
    model.setLastWin(70);

    const round = flow.spin();
    expect(model.balance).toBe(900);
    expect(model.lastWin).toBe(0);
    expect(resultSource.play).toHaveBeenCalledWith({ bet: 100 });

    pending.answer(wonRound);
    await round;
    expect(model.balance).toBe(1150);
    expect(model.lastWin).toBe(250);
  });

  it('spins the reels before the result arrives', () => {
    const pending = createPendingResult();
    const { flow, reels } = createRoundFlow(pending.play);

    void flow.spin();

    expect(reels.isSpinning).toBe(true);
    expect(flow.state).toBe('spinning');
  });

  it('ignores Spin while a round is on', async () => {
    const pending = createPendingResult();
    const { flow, resultSource } = createRoundFlow(pending.play);

    const round = flow.spin();
    await flow.spin();
    expect(resultSource.play).toHaveBeenCalledOnce();

    pending.answer(wonRound);
    await round;
    const nextRound = flow.spin();
    expect(resultSource.play).toHaveBeenCalledTimes(2);
    pending.answer(wonRound);
    await nextRound;
  });

  it('does not spin when the balance does not cover the bet', async () => {
    const { flow, model, resultSource } = createRoundFlow();
    model.setBalance(99);

    expect(flow.canSpin).toBe(false);
    await flow.spin();
    expect(resultSource.play).not.toHaveBeenCalled();
    expect(model.balance).toBe(99);
  });

  it('returns the bet and goes back to idle when the source fails', async () => {
    const consoleError = silenceConsoleError();
    const { events, flow, model, reels, states } = createRoundFlow(() =>
      Promise.reject(new Error('offline')),
    );
    const failed = vi.fn();
    events.on('roundFailed', failed);

    await flow.spin();

    expect(states).toEqual(['spinning', 'idle']);
    expect(model.balance).toBe(1000);
    expect(reels.cancelCount).toBe(1);
    expect(reels.isSpinning).toBe(false);
    expect(failed).toHaveBeenCalledExactlyOnceWith({ betReturned: true });
    consoleError.mockRestore();
  });

  it('treats an invalid result as a failed round', async () => {
    const consoleError = silenceConsoleError();
    const broken = { steps: [], totalWin: -5, balance: 900 };
    const { flow, model } = createRoundFlow(() => Promise.resolve(broken));

    await flow.spin();

    expect(flow.state).toBe('idle');
    expect(model.balance).toBe(1000);
    consoleError.mockRestore();
  });

  it('keeps the settled balance when the script fails after the source answered', async () => {
    const consoleError = silenceConsoleError();
    const unknownStep: RoundResult = { ...wonRound, steps: [{ type: 'tumble' }] };
    const { events, flow, model } = createRoundFlow(() => Promise.resolve(unknownStep));
    const failed = vi.fn();
    events.on('roundFailed', failed);

    await flow.spin();

    expect(flow.state).toBe('idle');
    expect(model.balance).toBe(1150);
    expect(failed).toHaveBeenCalledExactlyOnceWith({ betReturned: false });
    consoleError.mockRestore();
  });

  it('plays the next round normally after a failed one', async () => {
    const consoleError = silenceConsoleError();
    const { flow, model, resultSource } = createRoundFlow();
    resultSource.play.mockRejectedValueOnce(new Error('offline'));

    await flow.spin();
    await flow.spin();

    expect(model.balance).toBe(1150);
    consoleError.mockRestore();
  });

  it('hurries the reels on Stop while spinning, before and after the result', async () => {
    const pending = createPendingResult();
    const { flow, reels } = createRoundFlow(pending.play);
    reels.autoLand = false;

    const round = flow.spin();
    flow.stop();
    expect(reels.hurryCount).toBe(1);

    pending.answer(wonRound);
    await vi.waitFor(() => {
      expect(reels.target).toEqual(grid);
    });
    flow.stop();
    expect(reels.hurryCount).toBe(2);
    // Stop never replaces the result: the reels still land on the grid of the round.
    reels.finishLanding();
    await round;
    expect(reels.target).toEqual(grid);
  });

  it('ends the whole win presentation with one Stop while presenting', async () => {
    const { flow, pause } = createRoundFlow();
    const skipSignals: AbortSignal[] = [];
    pause.mockImplementation(
      (_ms, skip) =>
        new Promise((resolve) => {
          skipSignals.push(skip);
          skip.addEventListener('abort', () => {
            resolve();
          });
        }),
    );

    const round = flow.spin();
    await vi.waitFor(() => {
      expect(skipSignals).toHaveLength(1);
    });
    expect(flow.state).toBe('presenting');
    flow.stop();
    await round;

    // The totalWin step after the skipped wins does not wait for a second press.
    expect(skipSignals).toHaveLength(1);
    expect(flow.state).toBe('idle');
  });

  it('does nothing on Stop in idle', () => {
    const { flow, reels } = createRoundFlow();

    flow.stop();

    expect(reels.hurryCount).toBe(0);
    expect(flow.state).toBe('idle');
  });

  it('needs reels before the first Spin, and only one set of them', async () => {
    const events = new EventBus<GameEvents>();
    const model = new GameModel(events, { balance: 1000, bet: 100 });
    const flow = new RoundFlow({
      events,
      model,
      resultSource: { play: () => Promise.resolve(wonRound) },
      player: new RoundPlayer(),
    });

    await expect(flow.spin()).rejects.toThrow('context.round.useReels()');
    const { reels } = createRoundFlow();
    flow.useReels(reels);
    expect(() => {
      flow.useReels(reels);
    }).toThrow('reels are already connected');
  });

  describe('a bought round', () => {
    const bought = { mode: 'feature', cost: 500 };

    it('takes its cost instead of the bet and sends its mode', async () => {
      const pending = createPendingResult();
      const { flow, model, resultSource } = createRoundFlow(pending.play);

      const round = flow.buy(bought);
      expect(model.balance).toBe(500);
      expect(resultSource.play).toHaveBeenCalledWith({ bet: 100, mode: 'feature' });

      pending.answer(wonRound);
      await round;
      expect(model.balance).toBe(wonRound.balance);
      expect(model.lastWin).toBe(wonRound.totalWin);
    });

    it('keeps the reels still until the script lands them', async () => {
      const pending = createPendingResult();
      const { flow, reels, states } = createRoundFlow(pending.play);

      const round = flow.buy(bought);
      expect(reels.isSpinning).toBe(false);
      expect(flow.state).toBe('spinning');

      pending.answer(wonRound);
      await round;
      expect(states).toEqual(['spinning', 'presenting', 'idle']);
      expect(reels.target).toEqual(grid);
    });

    it('is not available during a round or without the balance for it', async () => {
      const pending = createPendingResult();
      const { flow, model, resultSource } = createRoundFlow(pending.play);

      expect(flow.canBuy(1000)).toBe(true);
      expect(flow.canBuy(1001)).toBe(false);
      await flow.buy({ mode: 'feature', cost: 1001 });
      expect(resultSource.play).not.toHaveBeenCalled();
      expect(model.balance).toBe(1000);

      void flow.spin();
      expect(flow.canBuy(1)).toBe(false);
      await flow.buy(bought);
      expect(resultSource.play).toHaveBeenCalledTimes(1);
    });

    it('returns its cost when the source fails', async () => {
      const error = silenceConsoleError();
      const { flow, model, events } = createRoundFlow(() => Promise.reject(new Error('offline')));
      const failed = vi.fn();
      events.on('roundFailed', failed);

      await flow.buy(bought);

      expect(model.balance).toBe(1000);
      expect(flow.state).toBe('idle');
      expect(failed).toHaveBeenCalledWith({ betReturned: true });
      error.mockRestore();
    });
  });
});
