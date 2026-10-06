import type { EventBus } from '../core/EventBus';
import type { GameEvents } from '../core/GameEvents';
import type { GameModel } from '../core/GameModel';
import type { RoundFlow } from '../flow/RoundFlow';
import { formatMoney } from '../math/money';

/** Every text the HUD shows. The game writes them in its config, in its language. */
export interface HudTexts {
  balance: string;
  bet: string;
  win: string;
  spin: string;
  stop: string;
  skip: string;
  /** Message while waiting for Spin. */
  idle: string;
  /** Message while the reels spin. */
  spinning: string;
  /** Put before the amount while wins are shown, e.g. "Lines pay". */
  wins: string;
  /** The round failed before it was played; the bet is back on the balance. */
  betReturned: string;
  /** The round failed after it was played; the balance is the settled one. */
  roundError: string;
  /** The balance does not cover the bet. */
  notEnoughBalance: string;
}

/** Everything the HUD shows, as plain data. */
export interface HudView {
  balance: string;
  bet: string;
  win: string;
  message: string;
  spinLabel: string;
  spinEnabled: boolean;
  betDownEnabled: boolean;
  betUpEnabled: boolean;
}

export interface HudPresenterDependencies {
  events: EventBus<GameEvents>;
  model: GameModel;
  round: Pick<RoundFlow, 'state' | 'canSpin' | 'spin' | 'stop'>;
  /** Bets the player can choose from, ascending, minor units. */
  betLevels: readonly number[];
  texts: HudTexts;
}

/**
 * The logic of the HUD without Pixi: turns model and round events into a `HudView`
 * and the player's presses into calls to the round flow and the model.
 * It never looks at the reels: everything it knows comes from events and the model.
 */
export class HudPresenter {
  private message: string;

  /** `render` is called now and after every change of what the HUD shows. */
  constructor(
    private readonly dependencies: HudPresenterDependencies,
    private readonly render: (view: HudView) => void,
  ) {
    const { events, texts } = dependencies;
    this.message = texts.idle;
    const update = (): void => {
      this.render(this.view());
    };
    events.on('balanceChanged', update);
    events.on('betChanged', update);
    events.on('lastWinChanged', update);
    events.on('roundStateChanged', (state) => {
      this.showMessage(state === 'presenting' ? this.message : texts[state]);
    });
    events.on('winsShown', ({ amount }) => {
      this.showMessage(`${texts.wins} ${formatMoney(amount)}`);
    });
    events.on('roundFailed', ({ betReturned }) => {
      this.showMessage(betReturned ? texts.betReturned : texts.roundError);
    });
    update();
  }

  /** The Spin button and its keys: Spin in idle, otherwise Stop or Skip. */
  pressSpin(): void {
    const { round } = this.dependencies;
    if (round.state === 'idle') {
      void round.spin();
      return;
    }
    round.stop();
  }

  /** Moves the bet one level down (-1) or up (+1). Only between rounds. */
  changeBet(direction: -1 | 1): void {
    const { model, round, betLevels } = this.dependencies;
    if (round.state !== 'idle') {
      return;
    }
    const next = betLevels[betLevels.indexOf(model.bet) + direction];
    if (next !== undefined) {
      model.setBet(next);
    }
  }

  private showMessage(message: string): void {
    this.message = message;
    this.render(this.view());
  }

  private spinLabel(): string {
    const { round, texts } = this.dependencies;
    switch (round.state) {
      case 'idle':
        return texts.spin;
      case 'spinning':
        return texts.stop;
      case 'presenting':
        return texts.skip;
    }
  }

  private view(): HudView {
    const { model, round, betLevels, texts } = this.dependencies;
    const idle = round.state === 'idle';
    const betIndex = betLevels.indexOf(model.bet);
    const shortOfMoney = idle && model.bet > model.balance;
    return {
      balance: formatMoney(model.balance),
      bet: formatMoney(model.bet),
      win: formatMoney(model.lastWin),
      message: shortOfMoney ? texts.notEnoughBalance : this.message,
      spinLabel: this.spinLabel(),
      spinEnabled: idle ? round.canSpin : true,
      betDownEnabled: idle && betIndex > 0,
      betUpEnabled: idle && betIndex < betLevels.length - 1,
    };
  }
}
