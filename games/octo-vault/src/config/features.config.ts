import type { Weighted } from 'slot-sdk';
import type { FreeSpinsBannerLook } from '../features/freeSpins/FreeSpinsBanner';
import type { FreeSpinsPanelLook } from '../features/freeSpins/FreeSpinsPanel';
import type { TentacleLook } from '../features/tentacleGrab/TentacleView';

export interface TentacleGrabSettings {
  /** How many tentacles one Octopus throws. */
  tentacles: readonly Weighted<number>[];
  /** The multiplier a tentacle gives the cell it grabs. */
  multipliers: readonly Weighted<number>[];
}

/**
 * The Grab: every Octopus that lands throws 2–4 tentacles, each turns a cell into a Wild
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

/** 3, 4 or 5 Keys anywhere start 8, 10 or 12 free spins. Free spins do not start again inside a series. */
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

/** Buy free spins straight away instead of waiting for 3 Keys. */
export const bonusBuyConfig: BonusBuySettings = {
  mode: 'bonus',
  priceInBets: 88,
  freeSpins: 10,
};

/** A tentacle on screen: quick enough that four of them read as one gesture. */
export const tentacleLook: TentacleLook = {
  color: '#c86bff',
  width: 26,
  growMs: 260,
  bend: 0.18,
};

/** Free spins on screen. The cards are short: the series itself is the show. */
export const freeSpinsLook: {
  introMs: number;
  summaryMs: number;
  texts: { intro: string; summary: string };
  banner: FreeSpinsBannerLook;
  panel: FreeSpinsPanelLook;
} = {
  introMs: 1800,
  summaryMs: 2200,
  texts: { intro: 'FREE SPINS', summary: 'FREE SPINS WIN' },
  banner: {
    fontFamily: 'Lilita One',
    titleColor: '#3ee6c4',
    valueColor: '#ffd23f',
    outlineColor: '#062033',
    titleSize: 130,
    valueSize: 210,
    dimColor: '#020c14',
    dimAlpha: 0.72,
    popMs: 360,
  },
  panel: {
    fontFamily: 'Lilita One',
    captionColor: '#3ee6c4',
    valueColor: '#ffd23f',
    captionFontSize: 30,
    valueFontSize: 64,
    spinsCaption: 'FREE SPINS',
    winCaption: 'SERIES WIN',
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
