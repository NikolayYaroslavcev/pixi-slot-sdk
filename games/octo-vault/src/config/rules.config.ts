import type { RegularSymbolId } from './symbols';

/** The Rules popup: what it says and how the paytable in it looks. Sizes are design pixels. */
export const rulesConfig = {
  title: 'PAYTABLE',
  /** `{lines}` is the number of paylines, counted from `paylines.ts`. */
  message: '{lines} lines pay left to right from the first reel. Amounts at the current bet.',
  close: 'CLOSE',
  /** Highest symbols first, four to a row: the order the eye reads value in. */
  order: [
    'compass',
    'map',
    'anchor',
    'rum',
    'ace',
    'king',
    'queen',
    'jack',
  ] satisfies RegularSymbolId[],
  columns: 4,
  // Four cells must fit the popup content: 940 wide minus 100 padding on each side.
  cellWidth: 180,
  symbolSize: 120,
  payFontSize: 30,
  rowGap: 18,
  /** The two special symbols and what they do. `{…}` are filled in from the feature configs. */
  specials: [
    {
      symbol: 'octopus',
      name: 'WILD',
      text: 'On reels 2–4. Throws tentacles that turn cells into Wilds with {multipliers}.',
    },
    {
      symbol: 'chest',
      name: 'SCATTER',
      text: '{scatters} anywhere start {spins} free spins with sticky Wilds.',
    },
  ],
  specialNameFontSize: 34,
  specialFontSize: 27,
  dividerColor: '#c4872d',
  textColor: '#fff0c8',
  countColor: '#f6d76a',
  amountColor: '#fff3b0',
} as const;
