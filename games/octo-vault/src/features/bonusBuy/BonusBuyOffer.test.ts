import { formatMoney, type BoughtRound, type PopupContent } from 'slot-sdk';
import { describe, expect, it, vi } from 'vitest';
import { bonusBuyConfig } from '../../config/features.config';
import { BonusBuyOffer } from './BonusBuyOffer';

/** A round flow with a balance and an idle flag, a bet, and a popup that answers `answer`. */
function createOffer(options: { balance?: number; idle?: boolean; answer?: string | null } = {}) {
  const { balance = 100_000, idle = true, answer = 'buy' } = options;
  const round = {
    canBuy: vi.fn((cost: number) => idle && cost <= balance),
    buy: vi.fn<(round: BoughtRound) => Promise<void>>(() => Promise.resolve()),
  };
  const popup = {
    open: vi.fn<(content: PopupContent) => Promise<string | null>>(() => Promise.resolve(answer)),
  };
  const offer = new BonusBuyOffer({ round, model: { bet: 200 }, popup });
  return { offer, round, popup };
}

describe('BonusBuyOffer', () => {
  const price = 200 * bonusBuyConfig.priceInBets;

  it('costs the configured number of bets at the current bet', () => {
    const { offer } = createOffer();

    expect(offer.price).toBe(price);
    expect(offer.priceLabel).toBe(formatMoney(price));
  });

  it('asks for confirmation with the price, then buys the bonus round for it', async () => {
    const { offer, round, popup } = createOffer();

    await offer.press();

    expect(popup.open.mock.calls[0]?.[0].message).toContain(formatMoney(price));
    expect(round.buy).toHaveBeenCalledWith({ mode: bonusBuyConfig.mode, cost: price });
  });

  it('changes nothing on cancel or when the popup is closed', async () => {
    for (const answer of ['cancel', null]) {
      const { offer, round } = createOffer({ answer });
      await offer.press();
      expect(round.buy).not.toHaveBeenCalled();
    }
  });

  it('is not available during a round', async () => {
    const { offer, round, popup } = createOffer({ idle: false });

    expect(offer.available).toBe(false);
    await offer.press();
    expect(popup.open).not.toHaveBeenCalled();
    expect(round.buy).not.toHaveBeenCalled();
  });

  it('is not available when the balance does not cover the price', async () => {
    const { offer, popup } = createOffer({ balance: price - 1 });

    expect(offer.available).toBe(false);
    await offer.press();
    expect(popup.open).not.toHaveBeenCalled();
  });
});
