import { findManifestProblems } from '../assets/AssetManifest';
import { findLayoutProblems } from '../layout/LayoutConfig';
import { isMinorUnits } from '../math/money';
import { hudNodeNames } from '../ui/Hud';
import { SlotGame, type SlotGameOptions } from './SlotGame';

/**
 * Entry point of the SDK for a game. Checks the options and returns a game ready to `start()`.
 * Throws one error that lists every problem found, so a broken config is fixed in one pass.
 *
 * @param options The game: config, asset manifest, layout, result source and features.
 * @returns The game, not started yet: call `start()` to load assets and show the first frame.
 * @throws When the options are invalid, e.g. a bet outside `betLevels` or a missing HUD node.
 *
 * ```ts
 * await createSlotGame({ config, assets, layout, resultSource, features: [myFeature()] }).start();
 * ```
 */
export function createSlotGame(options: SlotGameOptions): SlotGame {
  const problems = [
    ...findOptionProblems(options),
    ...findBetProblems(options.config),
    ...findWinProblems(options.config),
    ...findAssetProblems(options),
    ...findLayoutProblems(options.layout),
    ...findHudLayoutProblems(options.layout),
  ];
  if (problems.length > 0) {
    throw new Error(`createSlotGame: invalid options\n- ${problems.join('\n- ')}`);
  }
  return new SlotGame(options);
}

/** Runtime checks for what the type system cannot see, e.g. a fractional bet or a JS caller. */
function findOptionProblems(options: SlotGameOptions): string[] {
  const problems: string[] = [];
  const { config, resultSource, features = [] } = options;
  if (!isMinorUnits(config.initialBalance)) {
    problems.push(
      `config.initialBalance must be a non-negative integer in minor units, got ${String(config.initialBalance)}`,
    );
  }
  if (typeof resultSource.play !== 'function') {
    problems.push('resultSource must have a play(request) method');
  }
  features.forEach((feature, index) => {
    if (typeof feature.install !== 'function') {
      problems.push(`features[${String(index)}] must have an install(context) method`);
    }
  });
  return problems;
}

/** Times are waited on and Big Win tiers compared with wins: they must be real, non-negative numbers. */
function findWinProblems({ wins }: SlotGameOptions['config']): string[] {
  const problems: string[] = [];
  for (const [name, ms] of Object.entries(wins.timing)) {
    if (!(ms >= 0)) {
      problems.push(`config.wins.timing.${name} must be 0 or more milliseconds, got ${String(ms)}`);
    }
  }
  wins.bigWins.forEach((tier, index) => {
    const times = [tier.countUpMs, tier.holdMs];
    if (!(tier.minBets > 0) || !times.every((ms) => ms >= 0)) {
      problems.push(
        `config.wins.bigWins[${String(index)}] needs minBets above 0 and times of 0 or more milliseconds`,
      );
    }
  });
  return problems;
}

/** The bet steps along `betLevels`, so the levels must be valid bets in order and include the first one. */
function findBetProblems({ initialBet, betLevels }: SlotGameOptions['config']): string[] {
  const problems: string[] = [];
  if (!isMinorUnits(initialBet) || initialBet === 0) {
    problems.push(
      `config.initialBet must be a positive integer in minor units, got ${String(initialBet)}`,
    );
  }
  const ascending = betLevels.every(
    (level, index) => isMinorUnits(level) && level > (betLevels[index - 1] ?? 0),
  );
  if (betLevels.length === 0 || !ascending) {
    problems.push(
      `config.betLevels must be positive integers in minor units, ascending, got [${betLevels.join(', ')}]`,
    );
  }
  if (!betLevels.includes(initialBet)) {
    problems.push(`config.initialBet ${String(initialBet)} must be one of config.betLevels`);
  }
  return problems;
}

/** The HUD places its parts by fixed node names, so every layout must describe them. */
function findHudLayoutProblems(layout: SlotGameOptions['layout']): string[] {
  return hudNodeNames
    .filter((name) => !Object.hasOwn(layout.landscape.nodes, name))
    .map((name) => `layout.landscape.nodes is missing the HUD node "${name}"`);
}

function findAssetProblems({ config, assets }: SlotGameOptions): string[] {
  const problems = findManifestProblems(assets);
  const { logo } = config.loadingScreen;
  if (!assets.preload.some((entry) => entry.alias === logo)) {
    problems.push(`config.loadingScreen.logo "${logo}" must be an alias from assets.preload`);
  }
  return problems;
}
