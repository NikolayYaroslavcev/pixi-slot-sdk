import type { RoundStep, StandardStep } from 'slot-sdk';
import type { TentacleGrab } from './tentacleGrab';

/** Octopuses throw their tentacles: grabbed cells become Wilds with multipliers. */
export interface TentaclesStep extends RoundStep {
  readonly type: 'tentacles';
  readonly grabs: readonly TentacleGrab[];
}

/** Every step an Octo Vault round script may contain. */
export type OctoVaultStep = StandardStep | TentaclesStep;
