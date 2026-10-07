import { describe, expect, it, vi } from 'vitest';
import { EventBus } from '../core/EventBus';
import type { GameEvents } from '../core/GameEvents';
import type { Win } from '../math/round';
import { IdleWinReplay } from './IdleWinReplay';
import type { Pause, WinField } from './winSteps';

function win(amount: number): Win {
  return { cells: [{ reelIndex: 0, rowIndex: 0 }], amount };
}

/** A field that records calls, and a pause each test ends by hand. */
function createReplay() {
  const events = new EventBus<GameEvents>();
  const calls: string[] = [];
  const field: WinField = {
    showAll: vi.fn(),
    showOne: (shown) => calls.push(`one ${String(shown.amount)}`),
    clear: () => calls.push('clear'),
  };
  const waiting: (() => void)[] = [];
  const pause = vi.fn<Pause>(
    (_ms, signal) =>
      new Promise((resolve) => {
        waiting.push(resolve);
        signal.addEventListener('abort', () => {
          resolve();
        });
      }),
  );
  new IdleWinReplay(events, pause, 900, () => field);
  const nextWin = async () => {
    waiting.shift()?.();
    await Promise.resolve();
    await Promise.resolve();
  };
  return { events, calls, pause, nextWin };
}

describe('IdleWinReplay', () => {
  it('shows the wins of the last spin in turn once the round is over', async () => {
    const { events, calls, pause, nextWin } = createReplay();
    events.emit('spinStarted', undefined);
    events.emit('winsShown', { wins: [win(5), win(7)], amount: 12 });
    events.emit('roundStateChanged', 'idle');
    await nextWin();
    await nextWin();
    expect(calls).toEqual(['one 5', 'one 7', 'one 5']);
    expect(pause).toHaveBeenCalledWith(900, expect.any(AbortSignal));
  });

  it('stops and clears the field as soon as the next round starts', async () => {
    const { events, calls, nextWin } = createReplay();
    events.emit('winsShown', { wins: [win(5)], amount: 5 });
    events.emit('roundStateChanged', 'idle');
    events.emit('roundStateChanged', 'spinning');
    await nextWin();
    expect(calls).toEqual(['one 5', 'clear']);
  });

  it('forgets wins of an earlier spin, e.g. inside a free spins series', () => {
    const { events, calls } = createReplay();
    events.emit('winsShown', { wins: [win(5)], amount: 5 });
    events.emit('spinStarted', undefined);
    events.emit('roundStateChanged', 'idle');
    expect(calls).toEqual([]);
  });
});
