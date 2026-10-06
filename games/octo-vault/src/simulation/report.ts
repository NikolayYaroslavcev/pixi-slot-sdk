import type { BonusStats, SpinStats } from './simulate';

const percent = (value: number): string => `${(value * 100).toFixed(2)}%`;
const oneIn = (frequency: number): string =>
  frequency > 0 ? `1 in ${(1 / frequency).toFixed(1)}` : 'never';
const bets = (value: number): string => `${value.toFixed(1)} bets`;

/** The simulation as text for the terminal, one figure per line. */
export function formatReport(spins: SpinStats, bonus: BonusStats): string {
  return [
    `Paid spins: ${String(spins.spins)}`,
    `  total bet          ${String(spins.totalBet)}`,
    `  total win          ${String(spins.totalWin)}`,
    `  RTP                ${percent(spins.rtp)}`,
    `    base game        ${percent(spins.baseRtp)}`,
    `    free spins       ${percent(spins.freeSpinsRtp)}`,
    `  hit frequency      ${percent(spins.hitFrequency)}`,
    `  any Scatter        ${percent(spins.scatterFrequency)}`,
    `  free spins         ${oneIn(spins.freeSpinsFrequency)}`,
    `  Big Win            ${oneIn(spins.bigWinFrequency)}`,
    `  Mega Win           ${oneIn(spins.megaWinFrequency)}`,
    `  max win            ${bets(spins.maxWinInBets)}`,
    '',
    `Bonus Buy: ${String(bonus.purchases)} purchases at ${String(bonus.price)} each`,
    `  total cost         ${String(bonus.totalCost)}`,
    `  total win          ${String(bonus.totalWin)}`,
    `  RTP                ${percent(bonus.rtp)}`,
    `  average series     ${bets(bonus.averageWinInBets)}`,
    `  Big Win            ${oneIn(bonus.bigWinFrequency)}`,
    `  Mega Win           ${oneIn(bonus.megaWinFrequency)}`,
    `  max win            ${bets(bonus.maxWinInBets)}`,
  ].join('\n');
}
