import { describe, expect, it, vi } from 'vitest';
import { EventBus } from './EventBus';
import type { GameEvents } from './GameEvents';
import { GameModel } from './GameModel';

function createModel(): { model: GameModel; events: EventBus<GameEvents> } {
  const events = new EventBus<GameEvents>();
  const model = new GameModel(events, { balance: 10_000, bet: 100 });
  return { model, events };
}

describe('GameModel', () => {
  it('starts with the given balance and bet and no win', () => {
    const { model } = createModel();

    expect(model.balance).toBe(10_000);
    expect(model.bet).toBe(100);
    expect(model.lastWin).toBe(0);
  });

  it('publishes balanceChanged when the balance changes', () => {
    const { model, events } = createModel();
    const listener = vi.fn();
    events.on('balanceChanged', listener);

    model.setBalance(9_900);

    expect(model.balance).toBe(9_900);
    expect(listener).toHaveBeenCalledExactlyOnceWith(9_900);
  });

  it('publishes betChanged when the bet changes', () => {
    const { model, events } = createModel();
    const listener = vi.fn();
    events.on('betChanged', listener);

    model.setBet(200);

    expect(model.bet).toBe(200);
    expect(listener).toHaveBeenCalledExactlyOnceWith(200);
  });

  it('publishes lastWinChanged when the last win changes', () => {
    const { model, events } = createModel();
    const listener = vi.fn();
    events.on('lastWinChanged', listener);

    model.setLastWin(1_500);

    expect(model.lastWin).toBe(1_500);
    expect(listener).toHaveBeenCalledExactlyOnceWith(1_500);
  });

  it('does not publish when the value stays the same', () => {
    const { model, events } = createModel();
    const listener = vi.fn();
    events.on('betChanged', listener);

    model.setBet(100);

    expect(listener).not.toHaveBeenCalled();
  });

  it.each([1.5, -1, Number.NaN])('rejects %s as a money value and keeps the old one', (value) => {
    const { model } = createModel();

    expect(() => {
      model.setBalance(value);
    }).toThrow(/minor units/);
    expect(model.balance).toBe(10_000);
  });

  it('rejects fractional initial values', () => {
    expect(() => new GameModel(new EventBus<GameEvents>(), { balance: 0.1, bet: 100 })).toThrow(
      /balance/,
    );
  });
});
