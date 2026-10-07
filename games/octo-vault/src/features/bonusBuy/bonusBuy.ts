import { Sprite } from 'pixi.js';
import type { Feature } from 'slot-sdk';
import { bonusBuyLook, bonusBuyTexts } from '../../config/features.config';
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
      // The Scatter's chest: what the purchase opens.
      const picture = new Sprite({
        texture: context.assets.symbolTexture('chest'),
        anchor: { x: 0.5, y: 0 },
      });
      picture.setSize(bonusBuyLook.pictureSize);
      const offer = new BonusBuyOffer({ round, model, popup, picture });
      const button = context.hud.addButton('bonusBuy', bonusBuyTexts.button);
      const refresh = (): void => {
        button.setText(bonusBuyTexts.button, offer.priceLabel);
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
