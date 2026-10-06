import type { SymbolGrid } from '../config/symbols';

/**
 * Fixed fields the mock stops on, one per situation worth checking by hand.
 * Each grid is one array per reel, from the top. Pays are not written here:
 * the mock evaluates every field with the game math.
 */
export const scenarios = {
  /** Reel 1 has only low symbols, reel 2 only high ones and no Octopus can grab, so no line pays. */
  nowin: [
    ['shell', 'starfish', 'seahorse', 'fish'],
    ['pearl', 'anchor', 'chest', 'crown'],
    ['fish', 'key', 'shell', 'starfish'],
    ['crown', 'chest', 'pearl', 'anchor'],
    ['seahorse', 'fish', 'starfish', 'shell'],
  ],
  /** One line: 3 Anchors on the second row. */
  win: [
    ['shell', 'anchor', 'seahorse', 'fish'],
    ['pearl', 'anchor', 'chest', 'crown'],
    ['starfish', 'anchor', 'fish', 'shell'],
    ['chest', 'seahorse', 'crown', 'pearl'],
    ['fish', 'shell', 'starfish', 'key'],
  ],
  /** Two lines: 4 Crowns on the top row and 3 Fish on the bottom row. */
  multiwin: [
    ['crown', 'starfish', 'shell', 'fish'],
    ['crown', 'pearl', 'anchor', 'fish'],
    ['crown', 'seahorse', 'chest', 'fish'],
    ['crown', 'shell', 'pearl', 'starfish'],
    ['pearl', 'chest', 'seahorse', 'anchor'],
  ],
  /** Two Octopus Wilds complete 5 Chests on the second row and 4 Shells on another line. */
  wild: [
    ['seahorse', 'chest', 'shell', 'starfish'],
    ['anchor', 'octopus', 'pearl', 'fish'],
    ['shell', 'chest', 'crown', 'seahorse'],
    ['fish', 'octopus', 'starfish', 'pearl'],
    ['crown', 'chest', 'key', 'shell'],
  ],
  /**
   * Two Octopuses next to almost-lines of Anchors and Pearls: the Grab turns some of them
   * into winning lines with multipliers. Which ones depends on the seed.
   */
  tentacles: [
    ['anchor', 'pearl', 'shell', 'fish'],
    ['anchor', 'octopus', 'pearl', 'chest'],
    ['starfish', 'anchor', 'pearl', 'shell'],
    ['fish', 'pearl', 'octopus', 'anchor'],
    ['chest', 'shell', 'seahorse', 'anchor'],
  ],
  /** 3 Key Scatters and no line win. Free spins come in stage 10. */
  scatter: [
    ['key', 'shell', 'pearl', 'fish'],
    ['anchor', 'key', 'crown', 'pearl'],
    ['seahorse', 'fish', 'starfish', 'shell'],
    ['key', 'crown', 'octopus', 'anchor'],
    ['starfish', 'pearl', 'shell', 'seahorse'],
  ],
  /** 5 Crowns on the top row and 3 Fish on the bottom: 15.3 bets, a Big Win below Mega Win. */
  bigwin: [
    ['crown', 'shell', 'pearl', 'fish'],
    ['crown', 'starfish', 'anchor', 'fish'],
    ['crown', 'fish', 'key', 'fish'],
    ['crown', 'seahorse', 'shell', 'anchor'],
    ['crown', 'pearl', 'starfish', 'seahorse'],
  ],
  /** Crowns and Wilds almost everywhere: ten lines at once, over 100 bets. */
  megawin: [
    ['crown', 'crown', 'crown', 'chest'],
    ['crown', 'octopus', 'crown', 'chest'],
    ['crown', 'crown', 'octopus', 'chest'],
    ['crown', 'crown', 'crown', 'chest'],
    ['crown', 'anchor', 'crown', 'chest'],
  ],
} as const satisfies Record<string, SymbolGrid>;

export type FieldScenario = keyof typeof scenarios;

/** `error` has no field: the mock rejects the round, as a server that cannot be reached. */
export type ScenarioName = FieldScenario | 'error';

/** Without a scenario in the address, the mock goes through these in turn. */
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
  if (name === 'error' || Object.hasOwn(scenarios, name)) {
    return name as ScenarioName;
  }
  console.warn(
    `Unknown scenario "${name}". Known: ${[...Object.keys(scenarios), 'error'].join(', ')}`,
  );
  return undefined;
}
