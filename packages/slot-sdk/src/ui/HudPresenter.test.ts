import { describe, expect, it, vi } from 'vitest';
import { createRoundFlow, wonRound } from '../flow/roundFlowTestKit';
import type { RoundResult } from '../math/round';
import { HudPresenter, type HudTexts, type HudView } from './HudPresenter';

const texts: HudTexts = {
  balance: 'BALANCE',
  bet: 'BET',
  win: 'WIN',
  spin: 'SPIN',
  stop: 'STOP',
  skip: 'SKIP',
  idle: 'Press SPIN',
  spinning: 'Good luck',
  wins: 'Lines pay',
  betReturned: 'Bet returned',
  roundError: 'Round error',
  notEnoughBalance: 'Not enough balance',
};

function createHud(play?: () => Promise<RoundResult>) {
  const round = createRoundFlow(play);
  const views: HudView[] = [];
  const presenter = new HudPresenter(
    {
      events: round.events,
      model: round.model,
      round: round.flow,
      betLevels: [50, 100, 200],
      texts,
    },
    (view) => views.push(view),
  );
  const lastView = (): HudView | undefined => views.at(-1);
  return { ...round, presenter, views, lastView };
}

describe('HudPresenter', () => {
  it('shows the model and the idle state right away', () => {
    const { lastView } = createHud();

    expect(lastView()).toEqual({
      balance: '10.00',
      bet: '1.00',
      win: '0.00',
      message: 'Press SPIN',
      spinAction: 'spin',
      spinLabel: 'SPIN',
      spinEnabled: true,
      betDownEnabled: true,
      betUpEnabled: true,
    });
  });

  it('follows a whole round: Stop while spinning, the wins, then back to Spin', async () => {
    let answer: (result: RoundResult) => void = () => undefined;
    const { flow, presenter, views, lastView } = createHud(
      () => new Promise((resolve) => (answer = resolve)),
    );

    presenter.pressSpin();
    expect(lastView()).toMatchObject({
      balance: '9.00',
      spinAction: 'stop',
      spinLabel: 'STOP',
      message: 'Good luck',
    });
    expect(lastView()?.betUpEnabled).toBe(false);

    answer(wonRound);
    await vi.waitFor(() => {
      expect(flow.state).toBe('idle');
    });
    expect(views.some((view) => view.message === 'Lines pay 2.50')).toBe(true);
    expect(views.some((view) => view.spinLabel === 'SKIP')).toBe(true);
    expect(lastView()).toMatchObject({ balance: '11.50', win: '2.50', spinLabel: 'SPIN' });
  });

  it('turns the Spin button into Stop and Skip during a round', async () => {
    const { flow, presenter, reels } = createHud();
    reels.autoLand = false;
    const stop = vi.spyOn(flow, 'stop');

    presenter.pressSpin();
    presenter.pressSpin();

    expect(stop).toHaveBeenCalledOnce();
    await vi.waitFor(() => {
      expect(reels.target).not.toBeNull();
    });
    reels.finishLanding();
    await vi.waitFor(() => {
      expect(flow.state).toBe('idle');
    });
  });

  it('steps the bet through the levels, only between rounds', () => {
    const { model, presenter, lastView } = createHud();

    presenter.changeBet(1);
    expect(model.bet).toBe(200);
    expect(lastView()).toMatchObject({ bet: '2.00', betUpEnabled: false, betDownEnabled: true });
    presenter.changeBet(1);
    expect(model.bet).toBe(200);

    presenter.changeBet(-1);
    presenter.changeBet(-1);
    expect(model.bet).toBe(50);
    expect(lastView()?.betDownEnabled).toBe(false);

    presenter.pressSpin();
    presenter.changeBet(1);
    expect(model.bet).toBe(50);
  });

  it('tells that the bet was returned when the round failed', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const { flow, presenter, lastView } = createHud(() => Promise.reject(new Error('offline')));

    presenter.pressSpin();
    await vi.waitFor(() => {
      expect(flow.state).toBe('idle');
    });

    expect(lastView()).toMatchObject({
      message: 'Bet returned',
      balance: '10.00',
      spinLabel: 'SPIN',
    });
    consoleError.mockRestore();
  });

  it('disables Spin and explains why when the balance does not cover the bet', () => {
    const { model, lastView } = createHud();

    model.setBalance(40);

    expect(lastView()).toMatchObject({ spinEnabled: false, message: 'Not enough balance' });
  });
});
