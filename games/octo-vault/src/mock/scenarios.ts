import type { SymbolGrid } from '../config/symbols';

/**
 * Fixed fields the mock stops on, one per situation worth checking by hand.
 * Each grid is one array per reel, from the top. Pays are not written here:
 * the mock evaluates every field with the game math.
 */
export const scenarios = {
  /** Reel 1 has only low symbols, reel 2 only high ones and no Octopus can grab, so no line pays. */
  nowin: [
    ['jack', 'queen', 'king', 'ace'],
    ['rum', 'anchor', 'map', 'compass'],
    ['ace', 'chest', 'jack', 'queen'],
    ['compass', 'map', 'rum', 'anchor'],
    ['king', 'ace', 'queen', 'jack'],
  ],
  /** One line: 3 Anchors on the second row. */
  win: [
    ['jack', 'anchor', 'king', 'ace'],
    ['rum', 'anchor', 'map', 'compass'],
    ['queen', 'anchor', 'ace', 'jack'],
    ['map', 'king', 'compass', 'rum'],
    ['ace', 'jack', 'queen', 'chest'],
  ],
  /** Two lines: 4 Compasses on the top row and 3 Ace on the bottom row. */
  multiwin: [
    ['compass', 'queen', 'jack', 'ace'],
    ['compass', 'rum', 'anchor', 'ace'],
    ['compass', 'king', 'map', 'ace'],
    ['compass', 'jack', 'rum', 'queen'],
    ['rum', 'map', 'king', 'anchor'],
  ],
  /** Two Octopus Wilds complete 5 Maps on the second row and 4 Jacks on another line. */
  wild: [
    ['king', 'map', 'jack', 'queen'],
    ['anchor', 'octopus', 'rum', 'ace'],
    ['jack', 'map', 'compass', 'king'],
    ['ace', 'octopus', 'queen', 'rum'],
    ['compass', 'map', 'chest', 'jack'],
  ],
  /**
   * Two Octopuses next to almost-lines of Anchors and Rum bottles: the Grab turns some of them
   * into winning lines with multipliers. Which ones depends on the seed.
   */
  tentacles: [
    ['anchor', 'rum', 'jack', 'ace'],
    ['anchor', 'octopus', 'rum', 'map'],
    ['queen', 'anchor', 'rum', 'jack'],
    ['ace', 'rum', 'octopus', 'anchor'],
    ['map', 'jack', 'king', 'anchor'],
  ],
  /** 3 Chest Scatters and no line win: 8 free spins. */
  scatter: [
    ['chest', 'jack', 'rum', 'ace'],
    ['anchor', 'chest', 'compass', 'rum'],
    ['king', 'ace', 'queen', 'jack'],
    ['chest', 'compass', 'octopus', 'anchor'],
    ['queen', 'rum', 'jack', 'king'],
  ],
  /** 4 Chest Scatters: 10 free spins. */
  freespins4: [
    ['chest', 'jack', 'rum', 'ace'],
    ['anchor', 'chest', 'compass', 'rum'],
    ['king', 'ace', 'chest', 'jack'],
    ['map', 'compass', 'queen', 'anchor'],
    ['queen', 'rum', 'jack', 'chest'],
  ],
  /** A Chest Scatter on every reel: 12 free spins. */
  freespins5: [
    ['chest', 'jack', 'rum', 'ace'],
    ['anchor', 'chest', 'compass', 'rum'],
    ['king', 'ace', 'chest', 'jack'],
    ['map', 'compass', 'queen', 'chest'],
    ['chest', 'rum', 'jack', 'king'],
  ],
  /** 5 Compasses on the top row and 3 Ace on the bottom: 15.3 bets, a Big Win below Mega Win. */
  bigwin: [
    ['compass', 'jack', 'rum', 'ace'],
    ['compass', 'queen', 'anchor', 'ace'],
    ['compass', 'ace', 'chest', 'ace'],
    ['compass', 'king', 'jack', 'anchor'],
    ['compass', 'rum', 'queen', 'king'],
  ],
  /** Compasses and Wilds almost everywhere: ten lines at once, over 100 bets. */
  megawin: [
    ['compass', 'compass', 'compass', 'map'],
    ['compass', 'octopus', 'compass', 'map'],
    ['compass', 'compass', 'octopus', 'map'],
    ['compass', 'compass', 'compass', 'map'],
    ['compass', 'anchor', 'compass', 'map'],
  ],
} as const satisfies Record<string, SymbolGrid>;

export type FieldScenario = keyof typeof scenarios;

/**
 * `error` has no field: the mock rejects the round, as a server that cannot be reached.
 * `playlist` plays the fields of `playlist` in turn.
 */
export type ScenarioName = FieldScenario | 'error' | 'playlist';

const extraScenarios: readonly string[] = ['error', 'playlist'];

/** `?scenario=playlist` goes through these in turn, to see every case by hand. */
export const playlist: readonly FieldScenario[] = [
  'win',
  'nowin',
  'multiwin',
  'scatter',
  'wild',
  'tentacles',
  'nowin',
  'bigwin',
  'megawin',
];

/**
 * Reads `?scenario=` from the page address. An unknown name is reported in the console
 * and ignored, so a typo does not silently play the wrong round.
 */
export function scenarioFromAddress(search: string): ScenarioName | undefined {
  const name = new URLSearchParams(search).get('scenario');
  if (name === null) {
    return undefined;
  }
  if (extraScenarios.includes(name) || Object.hasOwn(scenarios, name)) {
    return name as ScenarioName;
  }
  console.warn(
    `Unknown scenario "${name}". Known: ${[...Object.keys(scenarios), ...extraScenarios].join(', ')}`,
  );
  return undefined;
}
