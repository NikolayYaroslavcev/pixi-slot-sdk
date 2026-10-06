import { easeInOutQuad, easeOutQuad } from '../anim/easing';
import { planStop, type ReelStopPlan } from './reelStop';

/** How the reels move. Speeds are in symbols per second, durations in milliseconds. */
export interface ReelMotionSettings {
  /** Speed at the first moving frame. */
  startSpeed: number;
  /** Speed while spinning. */
  maxSpeed: number;
  /** Time from `startSpeed` to `maxSpeed`, with constant acceleration. */
  accelerateMs: number;
  /** The first reel never starts braking earlier than this after the start, however early `stop()` comes. */
  minimumSpinMs: number;
  /** Time from `maxSpeed` to standing still `bounce` past the stop position. */
  decelerateMs: number;
  /** How far a reel goes past the stop before it settles back, in symbol heights. */
  bounce: number;
  /** Time to settle back from the bounce to the stop position. */
  bounceMs: number;
  /** Each next reel starts this much later than the previous one. */
  startDelayMs: number;
  /** Each next reel starts braking this much later than the previous one. */
  stopDelayMs: number;
}

/** `idle → accelerate → spinning → decelerate → bounce → idle`. */
export type ReelPhase = 'idle' | 'accelerate' | 'spinning' | 'decelerate' | 'bounce';

/** Motion state of one reel. Pure data: `advanceReel` changes it, the view only reads it. */
export interface ReelMotionData {
  phase: ReelPhase;
  /** Symbols travelled down. Slot `k` stands at row `k + position`. A whole number at rest. */
  position: number;
  /** Symbols per second over the last frame, negative while settling back from the bounce. */
  speed: number;
  /** Time since the spin started. `startAtMs` and `stopAtMs` are moments on this clock. */
  spinMs: number;
  /** Time since the current phase began. */
  phaseMs: number;
  startAtMs: number;
  /** Braking may begin from this moment, once the target is known. */
  stopAtMs: number;
  /** Symbols to land on, top to bottom. Null until the stop is requested. */
  target: readonly string[] | null;
  /** Set when braking is planned, cleared when the reel is at rest. */
  plan: ReelStopPlan | null;
  /** First slot of the rows where the reel last stopped. They show the field of `ReelGrid`. */
  restSlot: number;
}

export function createReelMotion(): ReelMotionData {
  return {
    phase: 'idle',
    position: 0,
    speed: 0,
    spinMs: 0,
    phaseMs: 0,
    startAtMs: 0,
    stopAtMs: Infinity,
    target: null,
    plan: null,
    restSlot: 0,
  };
}

/** Puts a reel at rest into `accelerate`. It keeps its position and starts moving at `startAtMs`. */
export function startReel(motion: ReelMotionData, startAtMs: number): void {
  enterPhase(motion, 'accelerate', 0);
  motion.spinMs = 0;
  motion.startAtMs = startAtMs;
  motion.stopAtMs = Infinity;
  motion.target = null;
  motion.plan = null;
}

/**
 * Distance covered from the start of braking to standing still at the bounce.
 * Braking follows `easeOutQuad`, which starts twice as fast as its average speed, so this
 * distance makes braking begin at exactly `maxSpeed`: the reel does not jerk when it starts to stop.
 */
export function decelerationDistance(settings: ReelMotionSettings): number {
  return ((settings.maxSpeed / 1000) * settings.decelerateMs) / 2;
}

/**
 * Moves the reel by one frame and switches phases when they end. Returns true on the frame
 * the reel comes to rest: its position is then exactly the planned whole number.
 */
export function advanceReel(
  motion: ReelMotionData,
  deltaMs: number,
  settings: ReelMotionSettings,
  rowCount: number,
): boolean {
  if (motion.phase === 'idle') {
    return false;
  }
  const before = motion.position;
  motion.spinMs += deltaMs;
  motion.phaseMs += deltaMs;
  const landed = advancePhase(motion, deltaMs, settings, rowCount);
  motion.speed = landed || deltaMs <= 0 ? 0 : ((motion.position - before) / deltaMs) * 1000;
  return landed;
}

function advancePhase(
  motion: ReelMotionData,
  deltaMs: number,
  settings: ReelMotionSettings,
  rowCount: number,
): boolean {
  switch (motion.phase) {
    case 'accelerate':
      accelerate(motion, deltaMs, settings);
      return false;
    case 'spinning':
      spin(motion, deltaMs, settings, rowCount);
      return false;
    case 'decelerate':
      decelerate(motion, settings);
      return false;
    case 'bounce':
      return settle(motion, settings);
    case 'idle':
      return false;
  }
}

function accelerate(motion: ReelMotionData, deltaMs: number, settings: ReelMotionSettings): void {
  const movingFromMs = Math.max(motion.spinMs - deltaMs, motion.startAtMs);
  const movingMs = motion.spinMs - movingFromMs;
  if (movingMs <= 0) {
    return;
  }
  // The speed in the middle of the frame is its average speed, because the speed grows linearly.
  const middleMs = (movingFromMs + motion.spinMs) / 2 - motion.startAtMs;
  const progress = Math.min(middleMs / settings.accelerateMs, 1);
  const speed = settings.startSpeed + (settings.maxSpeed - settings.startSpeed) * progress;
  motion.position += (speed / 1000) * movingMs;
  if (motion.spinMs - motion.startAtMs >= settings.accelerateMs) {
    enterPhase(motion, 'spinning', 0);
  }
}

function spin(
  motion: ReelMotionData,
  deltaMs: number,
  settings: ReelMotionSettings,
  rowCount: number,
): void {
  const symbolsPerMs = settings.maxSpeed / 1000;
  motion.position += symbolsPerMs * deltaMs;
  if (!motion.plan && motion.target && motion.spinMs >= motion.stopAtMs) {
    const brakingDistance = decelerationDistance(settings) - settings.bounce;
    motion.plan = planStop(motion.position, rowCount, brakingDistance);
  }
  if (motion.plan && motion.position >= motion.plan.brakeFrom) {
    // Braking starts at `brakeFrom`, the time the reel already spent past it counts as braking.
    enterPhase(motion, 'decelerate', (motion.position - motion.plan.brakeFrom) / symbolsPerMs);
    decelerate(motion, settings);
  }
}

function decelerate(motion: ReelMotionData, settings: ReelMotionSettings): void {
  const plan = requirePlan(motion);
  const progress = Math.min(motion.phaseMs / settings.decelerateMs, 1);
  motion.position = plan.brakeFrom + decelerationDistance(settings) * easeOutQuad(progress);
  if (progress === 1) {
    enterPhase(motion, 'bounce', motion.phaseMs - settings.decelerateMs);
    settle(motion, settings);
  }
}

/** Returns the reel from the bounce to the stop position. True when it is there. */
function settle(motion: ReelMotionData, settings: ReelMotionSettings): boolean {
  const plan = requirePlan(motion);
  const progress = settings.bounceMs > 0 ? Math.min(motion.phaseMs / settings.bounceMs, 1) : 1;
  // At progress 1 the bounce term is exactly 0, so the reel ends exactly on its stop position.
  motion.position = plan.stopPosition + settings.bounce * (1 - easeInOutQuad(progress));
  if (progress < 1) {
    return false;
  }
  enterPhase(motion, 'idle', 0);
  motion.restSlot = plan.landingSlot;
  motion.plan = null;
  return true;
}

function enterPhase(motion: ReelMotionData, phase: ReelPhase, phaseMs: number): void {
  motion.phase = phase;
  motion.phaseMs = phaseMs;
}

function requirePlan(motion: ReelMotionData): ReelStopPlan {
  if (!motion.plan) {
    throw new Error(`Reel motion: phase "${motion.phase}" needs a stop plan`);
  }
  return motion.plan;
}
