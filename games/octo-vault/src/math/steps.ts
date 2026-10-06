import type { CellPosition, RoundStep, StandardStep } from 'slot-sdk';
import type { StickyWild } from './playSpin';
import type { TentacleGrab } from './tentacleGrab';

/** Octopuses throw their tentacles: grabbed cells become Wilds with multipliers. */
export interface TentaclesStep extends RoundStep {
  readonly type: 'tentacles';
  readonly grabs: readonly TentacleGrab[];
}

/** A series of free spins begins. The whole series follows in the same script. */
export interface FreeSpinsStartStep extends RoundStep {
  readonly type: 'freeSpinsStart';
  /** Free spins in the series. */
  readonly count: number;
  /** The Scatters that started the series; empty when the series was bought. */
  readonly scatters: readonly CellPosition[];
}

/** The next free spin is about to start. */
export interface FreeSpinsUpdateStep extends RoundStep {
  readonly type: 'freeSpinsUpdate';
  /** Number of this free spin, from 1. */
  readonly spin: number;
  readonly count: number;
  /** Won in the series before this spin, minor units. */
  readonly seriesWin: number;
  /** Wilds that stay in place through this spin, with their multipliers. */
  readonly sticky: readonly StickyWild[];
}

/** The series is over: its total, and the sticky Wilds are released. */
export interface FreeSpinsEndStep extends RoundStep {
  readonly type: 'freeSpinsEnd';
  readonly count: number;
  /** Won in the whole series, minor units. */
  readonly seriesWin: number;
}

/** Every step an Octo Vault round script may contain. */
export type OctoVaultStep =
  StandardStep | TentaclesStep | FreeSpinsStartStep | FreeSpinsUpdateStep | FreeSpinsEndStep;
