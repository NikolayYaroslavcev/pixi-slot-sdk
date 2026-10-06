import { describe, expect, it } from 'vitest';
import {
  advanceReel,
  createReelMotion,
  decelerationDistance,
  startReel,
  type ReelMotionData,
  type ReelMotionSettings,
  type ReelPhase,
} from './reelMotion';

const settings: ReelMotionSettings = {
  startSpeed: 4,
  maxSpeed: 24,
  accelerateMs: 200,
  minimumSpinMs: 0,
  decelerateMs: 300,
  bounce: 0.12,
  bounceMs: 150,
  startDelayMs: 40,
  stopDelayMs: 170,
};
const rowCount = 4;
const target = ['a', 'b', 'c', 'd'];

function spinningReel(): ReelMotionData {
  const motion = createReelMotion();
  startReel(motion, 0);
  return motion;
}

/** Runs frames of `frameMs` until the reel lands, recording every phase it goes through. */
function runToRest(motion: ReelMotionData, frameMs = 16): ReelPhase[] {
  const phases: ReelPhase[] = [motion.phase];
  for (let frame = 0; frame < 10_000; frame += 1) {
    const landed = advanceReel(motion, frameMs, settings, rowCount);
    if (phases.at(-1) !== motion.phase) {
      phases.push(motion.phase);
    }
    if (landed) {
      return phases;
    }
  }
  throw new Error('The reel never landed');
}

describe('advanceReel', () => {
  it('leaves a reel at rest untouched', () => {
    const motion = createReelMotion();
    expect(advanceReel(motion, 16, settings, rowCount)).toBe(false);
    expect(motion).toEqual(createReelMotion());
  });

  it('waits for its start delay, then accelerates from the start speed', () => {
    const motion = createReelMotion();
    startReel(motion, 32);
    advanceReel(motion, 32, settings, rowCount);
    expect(motion.position).toBe(0);
    advanceReel(motion, 16, settings, rowCount);
    expect(motion.position).toBeGreaterThan(0);
    expect(motion.speed).toBeGreaterThanOrEqual(settings.startSpeed);
    expect(motion.speed).toBeLessThan(settings.maxSpeed);
  });

  it('reaches the full speed when acceleration ends and keeps it', () => {
    const motion = spinningReel();
    advanceReel(motion, 200, settings, rowCount);
    expect(motion.phase).toBe('spinning');
    advanceReel(motion, 16, settings, rowCount);
    expect(motion.speed).toBeCloseTo(settings.maxSpeed);
  });

  it('spins until it has a target and its stop moment has come', () => {
    const motion = spinningReel();
    advanceReel(motion, 1_000, settings, rowCount);
    motion.target = target;
    motion.stopAtMs = 2_000;
    advanceReel(motion, 500, settings, rowCount);
    expect(motion.phase).toBe('spinning');
    expect(motion.plan).toBeNull();
  });

  it('goes through every phase in order and lands on a whole position', () => {
    const motion = spinningReel();
    motion.target = target;
    motion.stopAtMs = 500;
    const phases = runToRest(motion);
    expect(phases).toEqual(['accelerate', 'spinning', 'decelerate', 'bounce', 'idle']);
    expect(Number.isInteger(motion.position)).toBe(true);
    expect(motion.speed).toBe(0);
    expect(motion.plan).toBeNull();
    expect(motion.restSlot).toBe(-motion.position);
  });

  it('lands exactly on the planned position whatever the frame length', () => {
    for (const frameMs of [7, 16, 33, 100]) {
      const motion = spinningReel();
      motion.target = target;
      motion.stopAtMs = 450;
      let planned = Number.NaN;
      while (!advanceReel(motion, frameMs, settings, rowCount)) {
        planned = motion.plan?.stopPosition ?? planned;
      }
      expect(motion.position).toBe(planned);
    }
  });

  it('starts braking at full speed, without a jerk', () => {
    const motion = spinningReel();
    motion.target = target;
    motion.stopAtMs = 400;
    let lastSpinningSpeed = 0;
    while (motion.phase !== 'decelerate') {
      lastSpinningSpeed = motion.speed;
      advanceReel(motion, 4, settings, rowCount);
    }
    expect(motion.speed).toBeGreaterThan(lastSpinningSpeed * 0.95);
    expect(motion.speed).toBeLessThanOrEqual(lastSpinningSpeed);
  });

  it('goes past the stop by the bounce and comes back', () => {
    const motion = spinningReel();
    motion.target = target;
    motion.stopAtMs = 300;
    let furthest = 0;
    while (!advanceReel(motion, 4, settings, rowCount)) {
      furthest = Math.max(furthest, motion.position);
    }
    expect(furthest - motion.position).toBeCloseTo(settings.bounce, 2);
  });

  it('moves down only, except when it settles back from the bounce', () => {
    const motion = spinningReel();
    motion.target = target;
    motion.stopAtMs = 300;
    let previous = motion.position;
    while (!advanceReel(motion, 16, settings, rowCount)) {
      if (motion.phase !== 'bounce') {
        expect(motion.position).toBeGreaterThanOrEqual(previous);
      }
      previous = motion.position;
    }
  });

  it('brakes over the configured distance', () => {
    expect(decelerationDistance(settings)).toBeCloseTo((0.024 * 300) / 2);
  });
});
