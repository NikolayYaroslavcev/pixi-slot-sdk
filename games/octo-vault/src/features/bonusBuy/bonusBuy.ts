import type { Feature } from 'slot-sdk';
import { BonusBuyOffer } from './BonusBuyOffer';

/**
 * Bonus Buy: a HUD button with the price at the current bet. Pressing it asks for confirmation
 * in the game's popup, then buys a round of free spins through the round flow. The button is
 * enabled only between rounds and when the balance covers the price.
 */
export function bonusBuy(): Feature {
  return {
    install(context) {
      const { events, model, round, popup } = context;
      const offer = new BonusBuyOffer({ round, model, popup });
      const button = context.hud.addButton('bonusBuy', offer.label);
      const refresh = (): void => {
        button.setText(offer.label);
        button.setEnabled(offer.available);
      };
      button.onPress(() => {
        void offer.press();
      });
      events.on('balanceChanged', refresh);
      events.on('betChanged', refresh);
      events.on('roundStateChanged', refresh);
      refresh();
    },
  };
}
