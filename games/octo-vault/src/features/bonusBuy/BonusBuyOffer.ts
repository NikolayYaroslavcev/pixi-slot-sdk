import { formatMoney, type GameModel, type Popup, type RoundControls } from 'slot-sdk';
import { bonusBuyConfig, bonusBuyTexts, type BonusBuySettings } from '../../config/features.config';
import { bonusPrice } from '../../math/bonusBuy';

export interface BonusBuyDependencies {
  round: Pick<RoundControls, 'canBuy' | 'buy'>;
  model: Pick<GameModel, 'bet'>;
  popup: Pick<Popup, 'open'>;
}

/**
 * The logic of Bonus Buy without Pixi: the price at the current bet, whether it can be bought
 * now, and the purchase itself — ask first, then buy. Free spins start from the bought round's
 * script; the balance changes only through the round flow, like for a spin.
 */
export class BonusBuyOffer {
  constructor(
    private readonly dependencies: BonusBuyDependencies,
    private readonly settings: BonusBuySettings = bonusBuyConfig,
  ) {}

  /** Minor units. */
  get price(): number {
    return bonusPrice(this.dependencies.model.bet, this.settings);
  }

  /** Only between rounds, and only when the balance covers the price. */
  get available(): boolean {
    return this.dependencies.round.canBuy(this.price);
  }

  /** The button text: what it is and what it costs now. */
  get label(): string {
    return `${bonusBuyTexts.button}\n${formatMoney(this.price)}`;
  }

  /** Asks the player to confirm and buys on "yes". Cancel changes nothing. */
  async press(): Promise<void> {
    if (!this.available) {
      return;
    }
    const answer = await this.dependencies.popup.open({
      title: bonusBuyTexts.title,
      message: bonusBuyTexts.message
        .replace('{spins}', String(this.settings.freeSpins))
        .replace('{price}', formatMoney(this.price)),
      buttons: [
        { label: bonusBuyTexts.confirm, value: 'buy' },
        { label: bonusBuyTexts.cancel, value: 'cancel' },
      ],
    });
    if (answer !== 'buy') {
      return;
    }
    // The round flow checks again: the state or the balance may have changed meanwhile.
    await this.dependencies.round.buy({ mode: this.settings.mode, cost: this.price });
  }
}
