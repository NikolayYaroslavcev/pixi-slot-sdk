import type { EventBus } from '../core/EventBus';
import type { GameEvents } from '../core/GameEvents';
import type { System, World } from '../ecs/World';
import type { ReelSpinner } from '../flow/ReelSpinner';
import { Held, ReelMotion, ReelStrip } from './components';
import type { ReelGrid } from './ReelGrid';
import {
  advanceReel,
  createReelMotion,
  decelerationDistance,
  startReel,
  type ReelMotionData,
  type ReelMotionSettings,
} from './reelMotion';

/**
 * Spins the reels of a `ReelGrid` and stops them on given symbols.
 *
 * Gives every reel entity a `ReelStrip` and a `ReelMotion` and moves them each frame.
 * When a reel comes to rest, its cells in `ReelGrid` get the target symbols, then
 * `reelStopped` is emitted. A cell whose symbol is `Held` keeps its symbol entity as it is. After the last reel, `spinCompleted` is emitted and `stop()` resolves.
 */
export class ReelMotionSystem<SymbolId extends string> implements System, ReelSpinner {
  /** Motion of each reel by reel index. The same objects as the `ReelMotion` components. */
  private readonly motions: ReelMotionData[];
  /** Resolves when the last reel lands. Exists from `stop()` until then. */
  private landing: Promise<void> | null = null;
  private finishSpin: (() => void) | null = null;
  /** The player asked to stop early during this spin. */
  private hurried = false;

  /** `strips` has one strip per reel; the symbols the reel shows while it spins. */
  constructor(
    private readonly world: World,
    private readonly grid: ReelGrid<SymbolId>,
    strips: readonly (readonly SymbolId[])[],
    private readonly settings: ReelMotionSettings,
    private readonly events: EventBus<GameEvents>,
  ) {
    assertStrips(grid.size.reelCount, strips);
    assertSettings(settings);
    this.motions = strips.map((symbols, reelIndex) => {
      const reel = grid.reelEntity(reelIndex);
      const motion = createReelMotion();
      world.add(reel, ReelStrip, { symbols });
      world.add(reel, ReelMotion, motion);
      return motion;
    });
  }

  /** True from `start()` until the last reel is at rest. */
  get isSpinning(): boolean {
    return this.motions.some((motion) => motion.phase !== 'idle');
  }

  /** Starts every reel, each `startDelayMs` after the previous one. */
  start(): void {
    if (this.isSpinning) {
      throw new Error('ReelMotionSystem: the reels are already spinning');
    }
    this.hurried = false;
    this.motions.forEach((motion, reelIndex) => {
      startReel(motion, reelIndex * this.settings.startDelayMs);
    });
    this.events.emit('spinStarted', undefined);
  }

  /**
   * Stops the reels on `columns`, one array of symbols per reel from the top. The reels brake
   * one by one, `stopDelayMs` apart, and not before `minimumSpinMs` from the start.
   * Resolves when the last reel is at rest.
   */
  stop(columns: readonly (readonly SymbolId[])[]): Promise<void> {
    if (!this.isSpinning || this.motions.some((motion) => motion.target)) {
      throw new Error('ReelMotionSystem: stop() needs spinning reels without a target yet');
    }
    this.assertColumns(columns);
    this.motions.forEach((motion, reelIndex) => {
      motion.target = columns[reelIndex] ?? null;
    });
    this.scheduleStops();
    this.landing = new Promise((resolve) => {
      this.finishSpin = resolve;
    });
    this.events.emit('reelsLanding', { columns });
    return this.landing;
  }

  /**
   * Keeps the reel `reelIndex` and every reel after it spinning `extraMs` longer, so they still
   * land in order, e.g. while a game builds suspense. Works on reels that have not started
   * braking; `hurry` takes the delay back, because the player asked for the result now.
   */
  delayStop(reelIndex: number, extraMs: number): void {
    this.motions.forEach((motion, index) => {
      if (index >= reelIndex && motion.phase !== 'idle' && motion.plan === null) {
        motion.stopAtMs += extraMs;
      }
    });
  }

  /**
   * Stops as soon as possible: `minimumSpinMs` is skipped and the reels brake
   * `quickStopDelayMs` apart. Before `stop()` it applies to the coming stop.
   */
  hurry(): void {
    if (!this.isSpinning) {
      return;
    }
    this.hurried = true;
    if (this.landing) {
      this.scheduleStops();
    }
  }

  /**
   * Ends the spin without a new result: the reels land quickly on the symbols the field
   * showed before the spin. Used when a round could not be played.
   */
  cancel(): Promise<void> {
    if (!this.isSpinning) {
      return Promise.resolve();
    }
    this.hurry();
    return this.landing ?? this.stop(this.grid.columns);
  }

  update(deltaMs: number): void {
    const { rowCount } = this.grid.size;
    // A plain loop: it runs every frame and creates nothing.
    for (let reelIndex = 0; reelIndex < this.motions.length; reelIndex += 1) {
      const motion = this.motions[reelIndex];
      if (motion && advanceReel(motion, deltaMs, this.settings, rowCount)) {
        this.land(reelIndex, motion);
      }
    }
  }

  private land(reelIndex: number, motion: ReelMotionData): void {
    // `target` is only ever set by `stop()`, from columns of `SymbolId`.
    const target = (motion.target ?? []) as readonly SymbolId[];
    target.forEach((symbolId, rowIndex) => {
      const cell = { reelIndex, rowIndex };
      if (this.world.has(this.grid.symbolEntity(cell), Held)) {
        return;
      }
      // A new entity: whatever a game attached to the old symbol does not land with the new one.
      this.grid.replaceSymbol(cell, symbolId);
    });
    motion.target = null;
    this.events.emit('reelStopped', { reelIndex });
    if (this.isSpinning) {
      return;
    }
    const finishSpin = this.finishSpin;
    this.finishSpin = null;
    this.landing = null;
    this.events.emit('spinCompleted', undefined);
    finishSpin?.();
  }

  /** Gives every reel the moment it may start braking. A reel that is already braking keeps its plan. */
  private scheduleStops(): void {
    const { minimumSpinMs, stopDelayMs, quickStopDelayMs } = this.settings;
    // The longest clock: a reel at rest stops counting, the others still spin.
    const nowMs = Math.max(...this.motions.map((motion) => motion.spinMs));
    const firstStopMs = this.hurried ? nowMs : Math.max(nowMs, minimumSpinMs);
    const delayMs = this.hurried ? quickStopDelayMs : stopDelayMs;
    this.motions.forEach((motion, reelIndex) => {
      motion.stopAtMs = Math.min(motion.stopAtMs, firstStopMs + reelIndex * delayMs);
    });
  }

  private assertColumns(columns: readonly (readonly SymbolId[])[]): void {
    const { reelCount, rowCount } = this.grid.size;
    if (columns.length !== reelCount || columns.some((column) => column.length !== rowCount)) {
      throw new Error(
        `ReelMotionSystem: stop() needs ${String(reelCount)} reels of ${String(rowCount)} symbols`,
      );
    }
  }
}

function assertStrips(reelCount: number, strips: readonly (readonly string[])[]): void {
  if (strips.length !== reelCount) {
    throw new Error(
      `ReelMotionSystem: expected ${String(reelCount)} reel strips, got ${String(strips.length)}`,
    );
  }
  const emptyReel = strips.findIndex((strip) => strip.length === 0);
  if (emptyReel !== -1) {
    throw new Error(`ReelMotionSystem: reel strip ${String(emptyReel)} is empty`);
  }
}

function assertSettings(settings: ReelMotionSettings): void {
  if (settings.maxSpeed <= 0 || settings.accelerateMs <= 0 || settings.decelerateMs <= 0) {
    throw new Error('ReelMotionSystem: maxSpeed, accelerateMs and decelerateMs must be above 0');
  }
  if (settings.quickStopDelayMs < 0) {
    throw new Error('ReelMotionSystem: quickStopDelayMs must be 0 or more');
  }
  if (settings.bounce < 0 || settings.bounce >= decelerationDistance(settings)) {
    throw new Error('ReelMotionSystem: bounce must be from 0 up to the braking distance');
  }
}
