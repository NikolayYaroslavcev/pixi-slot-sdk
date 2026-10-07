import type { Weighted } from 'slot-sdk';
import type { AnticipationGlowLook } from '../features/anticipation/AnticipationGlow';
import type { FreeSpinsBannerLook } from '../features/freeSpins/FreeSpinsBanner';
import type { FreeSpinsPanelLook } from '../features/freeSpins/FreeSpinsPanel';

export interface TentacleGrabSettings {
  /** How many tentacles one Octopus throws. */
  tentacles: readonly Weighted<number>[];
  /** The multiplier a tentacle gives the cell it grabs. */
  multipliers: readonly Weighted<number>[];
}

/**
 * The Grab: every Octopus that lands throws 2 to 4 tentacles, each turns a cell into a Wild
 * with ×2, ×3 or ×5. Weights are relative: 60 / 30 / 10 means 60% of the Octopuses throw two.
 */
export const tentacleGrabConfig: TentacleGrabSettings = {
  tentacles: [
    { value: 2, weight: 60 },
    { value: 3, weight: 30 },
    { value: 4, weight: 10 },
  ],
  multipliers: [
    { value: 2, weight: 72 },
    { value: 3, weight: 21 },
    { value: 5, weight: 7 },
  ],
};

export interface FreeSpinsSettings {
  /** Free spins by the number of Scatters, from the fewest that start a series. */
  spinsByScatters: readonly { scatters: number; spins: number }[];
}

/** 3, 4 or 5 Chests anywhere start 8, 10 or 12 free spins. A series never starts another one. */
export const freeSpinsConfig: FreeSpinsSettings = {
  spinsByScatters: [
    { scatters: 3, spins: 8 },
    { scatters: 4, spins: 10 },
    { scatters: 5, spins: 12 },
  ],
};

export interface BonusBuySettings {
  /** `RoundRequest.mode` of a bought round. */
  mode: string;
  /** What the bonus costs, in bets: at a bet of 1.00 a price of 100 is 100.00. */
  priceInBets: number;
  /** Free spins the purchase gives. */
  freeSpins: number;
}

/** Buy free spins straight away instead of waiting for 3 Chests. */
export const bonusBuyConfig: BonusBuySettings = {
  mode: 'bonus',
  priceInBets: 88,
  freeSpins: 10,
};

/**
 * Suspense after `scatters` Scatters in the base game: each reel after them spins `extraMs`
 * longer than the one before it would, under a pulsing gold light.
 */
export const anticipationConfig: { scatters: number; extraMs: number; glow: AnticipationGlowLook } =
  {
    scatters: 2,
    extraMs: 1100,
    glow: { color: '#ffc83a', width: 12, fillAlpha: 0.22, pulseMs: 650 },
  };

/** The chest in the purchase confirmation, design pixels. */
export const bonusBuyLook = { pictureSize: 230 };

/** Free spins on screen. The cards are short: the series itself is the show. */
export const freeSpinsLook: {
  introMs: number;
  summaryMs: number;
  /** Lettered plaques of the cards, aliases from the manifest. */
  titles: { intro: string; summary: string };
  banner: FreeSpinsBannerLook;
  panel: FreeSpinsPanelLook;
} = {
  introMs: 1800,
  summaryMs: 2200,
  titles: { intro: 'freeSpinsTitle', summary: 'freeSpinsWonTitle' },
  banner: {
    titleScale: 0.85,
    fontFamily: 'Lilita One',
    valueColor: '#fff3b0',
    outlineColor: '#2a1206',
    valueSize: 190,
    dimColor: '#0d0602',
    dimAlpha: 0.72,
    popMs: 360,
  },
  panel: {
    fontFamily: 'Lilita One',
    captionColor: '#f6d76a',
    valueColor: '#fff3b0',
    captionFontSize: 30,
    valueFontSize: 64,
    spinsCaption: 'FREE SPINS',
    winCaption: 'SERIES WIN',
    // The same wood plate as balance and win, so the values read over the logo and the sky too.
    valuePanel: { skin: 'valuePanelSkin', width: 330, height: 132 },
  },
};

/** Texts of the Bonus Buy button and its confirmation. `{spins}` and `{price}` are filled in. */
export const bonusBuyTexts = {
  button: 'BUY BONUS',
  title: 'BUY FREE SPINS',
  message: '{spins} free spins for {price}?',
  confirm: 'BUY',
  cancel: 'CANCEL',
};
