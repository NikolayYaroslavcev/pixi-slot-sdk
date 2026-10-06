import { findManifestProblems } from '../assets/AssetManifest';
import { findLayoutProblems } from '../layout/LayoutConfig';
import { isMinorUnits } from '../math/money';
import { SlotGame, type SlotGameOptions } from './SlotGame';

/**
 * Entry point of the SDK for a game. Checks the options and returns a game ready to `start()`.
 * Throws one error that lists every problem found, so a broken config is fixed in one pass.
 *
 * ```ts
 * await createSlotGame({ config, assets, layout, resultSource, features: [myFeature()] }).start();
 * ```
 */
export function createSlotGame(options: SlotGameOptions): SlotGame {
  const problems = [
    ...findOptionProblems(options),
    ...findAssetProblems(options),
    ...findLayoutProblems(options.layout),
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
  if (!isMinorUnits(config.initialBet) || config.initialBet === 0) {
    problems.push(
      `config.initialBet must be a positive integer in minor units, got ${String(config.initialBet)}`,
    );
  }
  if (typeof resultSource.play !== 'function') {
    problems.push('resultSource must have a play(request) method');
  }
  for (const [name, ms] of Object.entries(config.presentation)) {
    if (!(ms >= 0)) {
      problems.push(
        `config.presentation.${name} must be 0 or more milliseconds, got ${String(ms)}`,
      );
    }
  }
  features.forEach((feature, index) => {
    if (typeof feature.install !== 'function') {
      problems.push(`features[${String(index)}] must have an install(context) method`);
    }
  });
  return problems;
}

function findAssetProblems({ config, assets }: SlotGameOptions): string[] {
  const problems = findManifestProblems(assets);
  const { logo } = config.loadingScreen;
  if (!assets.preload.some((entry) => entry.alias === logo)) {
    problems.push(`config.loadingScreen.logo "${logo}" must be an alias from assets.preload`);
  }
  return problems;
}
