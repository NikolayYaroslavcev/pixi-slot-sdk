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
    ['bottle', 'anchor', 'wheel', 'skull'],
    ['ace', 'key', 'jack', 'queen'],
    ['skull', 'wheel', 'bottle', 'anchor'],
    ['king', 'ace', 'queen', 'jack'],
  ],
  /** One line: 3 Anchors on the second row. */
  win: [
    ['jack', 'anchor', 'king', 'ace'],
    ['bottle', 'anchor', 'wheel', 'skull'],
    ['queen', 'anchor', 'ace', 'jack'],
    ['wheel', 'king', 'skull', 'bottle'],
    ['ace', 'jack', 'queen', 'key'],
  ],
  /** Two lines: 4 Skulls on the top row and 3 Ace on the bottom row. */
  multiwin: [
    ['skull', 'queen', 'jack', 'ace'],
    ['skull', 'bottle', 'anchor', 'ace'],
    ['skull', 'king', 'wheel', 'ace'],
    ['skull', 'jack', 'bottle', 'queen'],
    ['bottle', 'wheel', 'king', 'anchor'],
  ],
  /** Two Octopus Wilds complete 5 Chests on the second row and 4 Shells on another line. */
  wild: [
    ['king', 'wheel', 'jack', 'queen'],
    ['anchor', 'octopus', 'bottle', 'ace'],
    ['jack', 'wheel', 'skull', 'king'],
    ['ace', 'octopus', 'queen', 'bottle'],
    ['skull', 'wheel', 'key', 'jack'],
  ],
  /**
   * Two Octopuses next to almost-lines of Anchors and Pearls: the Grab turns some of them
   * into winning lines with multipliers. Which ones depends on the seed.
   */
  tentacles: [
    ['anchor', 'bottle', 'jack', 'ace'],
    ['anchor', 'octopus', 'bottle', 'wheel'],
    ['queen', 'anchor', 'bottle', 'jack'],
    ['ace', 'bottle', 'octopus', 'anchor'],
    ['wheel', 'jack', 'king', 'anchor'],
  ],
  /** 3 Key Scatters and no line win: 8 free spins. */
  scatter: [
    ['key', 'jack', 'bottle', 'ace'],
    ['anchor', 'key', 'skull', 'bottle'],
    ['king', 'ace', 'queen', 'jack'],
    ['key', 'skull', 'octopus', 'anchor'],
    ['queen', 'bottle', 'jack', 'king'],
  ],
  /** 4 Key Scatters: 10 free spins. */
  freespins4: [
    ['key', 'jack', 'bottle', 'ace'],
    ['anchor', 'key', 'skull', 'bottle'],
    ['king', 'ace', 'key', 'jack'],
    ['wheel', 'skull', 'queen', 'anchor'],
    ['queen', 'bottle', 'jack', 'key'],
  ],
  /** A Key Scatter on every reel: 12 free spins. */
  freespins5: [
    ['key', 'jack', 'bottle', 'ace'],
    ['anchor', 'key', 'skull', 'bottle'],
    ['king', 'ace', 'key', 'jack'],
    ['wheel', 'skull', 'queen', 'key'],
    ['key', 'bottle', 'jack', 'king'],
  ],
  /** 5 Skulls on the top row and 3 Ace on the bottom: 15.3 bets, a Big Win below Mega Win. */
  bigwin: [
    ['skull', 'jack', 'bottle', 'ace'],
    ['skull', 'queen', 'anchor', 'ace'],
    ['skull', 'ace', 'key', 'ace'],
    ['skull', 'king', 'jack', 'anchor'],
    ['skull', 'bottle', 'queen', 'king'],
  ],
  /** Skulls and Wilds almost everywhere: ten lines at once, over 100 bets. */
  megawin: [
    ['skull', 'skull', 'skull', 'wheel'],
    ['skull', 'octopus', 'skull', 'wheel'],
    ['skull', 'skull', 'octopus', 'wheel'],
    ['skull', 'skull', 'skull', 'wheel'],
    ['skull', 'anchor', 'skull', 'wheel'],
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
