import { Ticker } from 'pixi.js';
import { describe, expect, it, vi } from 'vitest';
import { waitUnlessSkipped } from '../anim/tween';
import type { TotalWinStep, Win, WinsStep } from '../math/round';
import { createWinSteps, testWinTiming } from './roundFlowTestKit';
import { RoundPlayer } from './RoundPlayer';
import { WinSteps, type Pause } from './winSteps';

const instantPause = () => vi.fn<Pause>(() => Promise.resolve());

/** A pause that only ends when its step is skipped. */
const pauseUntilSkip = () =>
  vi.fn<Pause>(
    (_ms, skip) =>
      new Promise((resolve) => {
        skip.addEventListener('abort', () => {
          resolve();
        });
      }),
  );

function win(amount: number, reelIndex = 0): Win {
  return { cells: [{ reelIndex, rowIndex: 1 }], amount };
}

function winsStep(...wins: Win[]): WinsStep {
  return { type: 'wins', wins, amount: wins.reduce((sum, each) => sum + each.amount, 0) };
}

function totalWin(amount: number): TotalWinStep {
  return { type: 'totalWin', amount };
}

describe('WinSteps: wins', () => {
  it('shows a single win once, with the counter, and clears the field', async () => {
    const pause = instantPause();
    const { events, field, player } = createWinSteps(pause);
    const shown = vi.fn();
    events.on('winsShown', shown);
    const step = winsStep(win(50));

    await player.play([step]);

    expect(shown).toHaveBeenCalledExactlyOnceWith({ wins: step.wins, amount: 50 });
    expect(field.calls).toEqual(['all 1 50 in 600', 'clear']);
    expect(pause).toHaveBeenCalledExactlyOnceWith(1000, expect.any(AbortSignal));
    expect(field.active).toBe(false);
  });

  it('shows all wins with their sum, then each win in turn', async () => {
    const pause = instantPause();
    const { field, player } = createWinSteps(pause);

    await player.play([winsStep(win(50, 0), win(30, 1), win(20, 2))]);

    expect(field.calls).toEqual(['all 3 100 in 600', 'one 50', 'one 30', 'one 20', 'clear']);
    expect(pause.mock.calls.map(([ms]) => ms)).toEqual([1000, 700, 700, 700]);
  });

  it('fails clearly when the game has not connected a field', async () => {
    const player = new RoundPlayer();
    const { model, events } = createWinSteps(instantPause());
    new WinSteps(player, {
      events,
      model,
      pause: instantPause(),
      timing: testWinTiming,
      bigWins: [],
      bigWinScreen: { show: vi.fn(), fadeOut: vi.fn(), hide: vi.fn() },
    });

    await expect(player.play([winsStep(win(50))])).rejects.toThrow(
      'WinSteps: no field. Connect it in a feature with context.wins.useField()',
    );
  });
});

describe('WinSteps: totalWin', () => {
  it('puts a small total into the model and holds it without an overlay', async () => {
    const pause = instantPause();
    const { bigWinScreen, model, player } = createWinSteps(pause);

    await player.play([totalWin(999)]);

    expect(model.lastWin).toBe(999);
    expect(pause).toHaveBeenCalledExactlyOnceWith(500, expect.any(AbortSignal));
    expect(bigWinScreen.calls).toEqual([]);
  });

  it('does not wait after a round without a win', async () => {
    const pause = instantPause();
    const { model, player } = createWinSteps(pause);

    await player.play([totalWin(0)]);

    expect(model.lastWin).toBe(0);
    expect(pause).not.toHaveBeenCalled();
  });

  it('shows Big Win from its threshold and counts up to the total', async () => {
    const pause = instantPause();
    const { bigWinScreen, player } = createWinSteps(pause);

    // Bet 100, Big Win from 10 bets.
    await player.play([totalWin(1000)]);

    expect(bigWinScreen.calls).toEqual(['show BIG 1000', 'fadeOut', 'hide']);
    // Count and hold of the tier, then the fade.
    expect(pause.mock.calls.map(([ms]) => ms)).toEqual([3000, 200]);
    expect(bigWinScreen.active).toBe(false);
  });

  it('shows Mega Win above its threshold', async () => {
    const { bigWinScreen, player } = createWinSteps(instantPause());

    await player.play([totalWin(4321)]);

    expect(bigWinScreen.calls[0]).toBe('show MEGA 4321');
  });
});

describe('WinSteps: skip', () => {
  it('ends the wins and the total of a round with one skip', async () => {
    const pause = pauseUntilSkip();
    const { field, model, player } = createWinSteps(pause);

    const playing = player.play([winsStep(win(50, 0), win(30, 1)), totalWin(80)]);
    player.skip();
    await playing;

    expect(field.calls).toEqual(['all 2 80 in 600', 'clear']);
    expect(field.active).toBe(false);
    expect(pause).toHaveBeenCalledOnce();
    expect(model.lastWin).toBe(80);
  });

  it('ends a Big Win at once and removes its overlay', async () => {
    const { bigWinScreen, model, player } = createWinSteps(pauseUntilSkip());

    const playing = player.play([totalWin(5000)]);
    player.skip();
    await playing;

    expect(bigWinScreen.calls).toEqual(['show MEGA 5000', 'hide']);
    expect(bigWinScreen.active).toBe(false);
    expect(model.lastWin).toBe(5000);
  });

  it('plays the next round in full after a skipped one', async () => {
    const pause = pauseUntilSkip();
    const { bigWinScreen, field, player } = createWinSteps(pause);
    const playing = player.play([winsStep(win(50)), totalWin(1500)]);
    player.skip();
    await playing;
    pause.mockImplementation(() => Promise.resolve());

    await player.play([winsStep(win(1500)), totalWin(1500)]);

    expect(field.calls.slice(-2)).toEqual(['all 1 1500 in 600', 'clear']);
    expect(bigWinScreen.calls).toEqual(['show BIG 1500', 'fadeOut', 'hide']);
  });

  it('leaves no timer on the game clock after a skip', async () => {
    const ticker = new Ticker();
    ticker.autoStart = false;
    const pause: Pause = (ms, skip) => waitUnlessSkipped(ticker, ms, skip);
    const { player } = createWinSteps(pause);

    const playing = player.play([winsStep(win(50), win(70, 1)), totalWin(1200)]);
    expect(ticker.count).toBe(1);
    player.skip();
    await playing;

    expect(ticker.count).toBe(0);
  });
});
