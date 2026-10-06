import { isMinorUnits } from '../math/money';
import type { EventBus } from './EventBus';
import type { GameEvents } from './GameEvents';

export interface GameModelValues {
  /** Minor units. */
  balance: number;
  /** Minor units. */
  bet: number;
}

/**
 * Money state of the game: balance, bet and last win, all in minor units.
 * Every change is published to the event bus, so views only subscribe and never poll.
 * Knows nothing about Pixi.
 */
export class GameModel {
  private balanceValue: number;
  private betValue: number;
  private lastWinValue = 0;

  constructor(
    private readonly events: EventBus<GameEvents>,
    initial: GameModelValues,
  ) {
    this.balanceValue = checkMinorUnits('balance', initial.balance);
    this.betValue = checkMinorUnits('bet', initial.bet);
  }

  get balance(): number {
    return this.balanceValue;
  }

  get bet(): number {
    return this.betValue;
  }

  get lastWin(): number {
    return this.lastWinValue;
  }

  setBalance(balance: number): void {
    if (checkMinorUnits('balance', balance) === this.balanceValue) {
      return;
    }
    this.balanceValue = balance;
    this.events.emit('balanceChanged', balance);
  }

  setBet(bet: number): void {
    if (checkMinorUnits('bet', bet) === this.betValue) {
      return;
    }
    this.betValue = bet;
    this.events.emit('betChanged', bet);
  }

  setLastWin(lastWin: number): void {
    if (checkMinorUnits('lastWin', lastWin) === this.lastWinValue) {
      return;
    }
    this.lastWinValue = lastWin;
    this.events.emit('lastWinChanged', lastWin);
  }
}

function checkMinorUnits(name: string, value: number): number {
  if (!isMinorUnits(value)) {
    throw new Error(
      `GameModel: ${name} must be a non-negative integer in minor units, got ${String(value)}`,
    );
  }
  return value;
}
