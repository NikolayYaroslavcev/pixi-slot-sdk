import { createRng } from 'slot-sdk';
import { gameConfig } from '../config/game.config';
import { bonusPrice, playBonusRound } from '../math/bonusBuy';
import { playRound, type PlayedRound } from '../math/playRound';

/** Counts over many rounds. Money in minor units. */
interface Tally {
  rounds: number;
  cost: number;
  win: number;
  baseWin: number;
  freeSpinsWin: number;
  hits: number;
  withScatter: number;
  withFreeSpins: number;
  bigWins: number;
  megaWins: number;
  maxWin: number;
}

/** What players get back from paid spins. Frequencies are shares of rounds, from 0 to 1. */
export interface SpinStats {
  spins: number;
  totalBet: number;
  totalWin: number;
  /** Total win / total bet. */
  rtp: number;
  /** The part of the RTP paid by the paid spins themselves, Grab included. */
  baseRtp: number;
  /** The part of the RTP paid by free spins. */
  freeSpinsRtp: number;
  /** Rounds that won anything. */
  hitFrequency: number;
  /** Paid spins with at least one Scatter on the field. */
  scatterFrequency: number;
  /** Rounds that started free spins. */
  freeSpinsFrequency: number;
  /** Rounds that reached Big Win, but not Mega Win. */
  bigWinFrequency: number;
  megaWinFrequency: number;
  maxWinInBets: number;
}

/** What players get back from buying the bonus. */
export interface BonusStats {
  purchases: number;
  /** Price of one purchase, minor units. */
  price: number;
  totalCost: number;
  totalWin: number;
  /** Total win / total cost. */
  rtp: number;
  averageWinInBets: number;
  bigWinFrequency: number;
  megaWinFrequency: number;
  maxWinInBets: number;
}

/** Big Win and Mega Win thresholds from the game config, in bets. */
const [bigWinBets = Infinity, megaWinBets = Infinity] = gameConfig.wins.bigWins.map(
  (tier) => tier.minBets,
);

/**
 * Plays `spins` paid rounds with the same rules as the mock server, without the screen.
 * The same seed gives the same numbers.
 */
export function simulateSpins(spins: number, bet: number, seed: number): SpinStats {
  const rng = createRng(seed);
  const tally = emptyTally();
  for (let round = 0; round < spins; round += 1) {
    count(tally, playRound(bet, rng), bet, bet);
  }
  return {
    spins,
    totalBet: tally.cost,
    totalWin: tally.win,
    rtp: share(tally.win, tally.cost),
    baseRtp: share(tally.baseWin, tally.cost),
    freeSpinsRtp: share(tally.freeSpinsWin, tally.cost),
    hitFrequency: share(tally.hits, spins),
    scatterFrequency: share(tally.withScatter, spins),
    freeSpinsFrequency: share(tally.withFreeSpins, spins),
    bigWinFrequency: share(tally.bigWins, spins),
    megaWinFrequency: share(tally.megaWins, spins),
    maxWinInBets: tally.maxWin / bet,
  };
}

/** Buys the bonus `purchases` times at `bet` and plays every bought series. */
export function simulateBonusBuys(purchases: number, bet: number, seed: number): BonusStats {
  const rng = createRng(seed);
  const price = bonusPrice(bet);
  const tally = emptyTally();
  for (let round = 0; round < purchases; round += 1) {
    count(tally, playBonusRound(bet, rng), price, bet);
  }
  return {
    purchases,
    price,
    totalCost: tally.cost,
    totalWin: tally.win,
    rtp: share(tally.win, tally.cost),
    averageWinInBets: share(tally.win, purchases * bet),
    bigWinFrequency: share(tally.bigWins, purchases),
    megaWinFrequency: share(tally.megaWins, purchases),
    maxWinInBets: tally.maxWin / bet,
  };
}

function emptyTally(): Tally {
  return {
    rounds: 0,
    cost: 0,
    win: 0,
    baseWin: 0,
    freeSpinsWin: 0,
    hits: 0,
    withScatter: 0,
    withFreeSpins: 0,
    bigWins: 0,
    megaWins: 0,
    maxWin: 0,
  };
}

function count(tally: Tally, round: PlayedRound, cost: number, bet: number): void {
  const { totalWin, base, freeSpins } = round;
  tally.rounds += 1;
  tally.cost += cost;
  tally.win += totalWin;
  tally.baseWin += base?.outcome.totalWin ?? 0;
  tally.freeSpinsWin += freeSpins?.totalWin ?? 0;
  tally.maxWin = Math.max(tally.maxWin, totalWin);
  countEvents(tally, round, bet);
}

/** Rounds in which something happened, each counted once. */
function countEvents(tally: Tally, { totalWin, base, freeSpins }: PlayedRound, bet: number): void {
  const inBets = totalWin / bet;
  tally.hits += Number(totalWin > 0);
  tally.withScatter += Number((base?.outcome.scatters.length ?? 0) > 0);
  tally.withFreeSpins += Number(base !== undefined && freeSpins !== undefined);
  tally.bigWins += Number(inBets >= bigWinBets && inBets < megaWinBets);
  tally.megaWins += Number(inBets >= megaWinBets);
}

function share(part: number, whole: number): number {
  return whole > 0 ? part / whole : 0;
}
