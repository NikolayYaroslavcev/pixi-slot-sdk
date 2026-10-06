import { describe, expect, it, vi } from 'vitest';
import { EventBus } from '../core/EventBus';
import type { GameEvents } from '../core/GameEvents';
import { World } from '../ecs/World';
import { ReelMotion, ReelStrip } from './components';
import { ReelGrid } from './ReelGrid';
import type { ReelMotionSettings } from './reelMotion';
import { ReelMotionSystem } from './ReelMotionSystem';

type TestSymbol = 'a' | 'b' | 'c' | 'x';

const settings: ReelMotionSettings = {
  startSpeed: 4,
  maxSpeed: 24,
  accelerateMs: 200,
  minimumSpinMs: 600,
  decelerateMs: 300,
  bounce: 0.12,
  bounceMs: 150,
  startDelayMs: 40,
  stopDelayMs: 170,
  quickStopDelayMs: 50,
};
const size = { reelCount: 3, rowCount: 2 };
const strips: TestSymbol[][] = [
  ['a', 'b', 'c'],
  ['b', 'c', 'a'],
  ['c', 'a', 'b'],
];
const target: TestSymbol[][] = [
  ['x', 'x'],
  ['a', 'x'],
  ['x', 'c'],
];

function createSystem() {
  const world = new World();
  const events = new EventBus<GameEvents>();
  const grid = new ReelGrid<TestSymbol>(world, size, [
    ['a', 'a'],
    ['b', 'b'],
    ['c', 'c'],
  ]);
  const system = new ReelMotionSystem(world, grid, strips, settings, events);
  return { world, events, grid, system };
}

/** Runs 16 ms frames until the spin completes. Returns the time of each frame a reel stopped. */
function runSpin(system: ReelMotionSystem<TestSymbol>, events: EventBus<GameEvents>) {
  const stops: { reelIndex: number; ms: number }[] = [];
  let ms = 0;
  events.on('reelStopped', ({ reelIndex }) => stops.push({ reelIndex, ms }));
  while (system.isSpinning && ms < 60_000) {
    ms += 16;
    system.update(16);
  }
  return { stops, ms };
}

describe('ReelMotionSystem', () => {
  it('gives every reel entity its strip and a motion at rest', () => {
    const { world, grid } = createSystem();
    expect(world.get(grid.reelEntity(1), ReelStrip)?.symbols).toEqual(strips[1]);
    expect(world.get(grid.reelEntity(2), ReelMotion)?.phase).toBe('idle');
  });

  it('starts the reels one by one, startDelayMs apart', () => {
    const { world, grid, system } = createSystem();
    system.start();
    system.update(48);
    const positions = [0, 1, 2].map(
      (reelIndex) => world.get(grid.reelEntity(reelIndex), ReelMotion)?.position,
    );
    expect(positions[0]).toBeGreaterThan(0);
    expect(positions[1]).toBeGreaterThan(0);
    expect(positions[2]).toBe(0);
  });

  it('stops the reels left to right, stopDelayMs apart, not before minimumSpinMs', () => {
    const { events, system } = createSystem();
    system.start();
    void system.stop(target);
    const { stops } = runSpin(system, events);
    expect(stops.map((stop) => stop.reelIndex)).toEqual([0, 1, 2]);
    const [first, second, third] = stops.map((stop) => stop.ms);
    expect(first).toBeGreaterThan(settings.minimumSpinMs + settings.decelerateMs);
    // A reel may spin up to one symbol longer to reach a whole stop position: 1/24 s at full speed.
    expect((second ?? 0) - (first ?? 0)).toBeGreaterThan(settings.stopDelayMs - 45);
    expect((second ?? 0) - (first ?? 0)).toBeLessThan(settings.stopDelayMs + 45);
    expect((third ?? 0) - (second ?? 0)).toBeGreaterThan(settings.stopDelayMs - 45);
  });

  it('writes the target into the grid, so the field matches it after the spin', async () => {
    const { events, grid, system } = createSystem();
    system.start();
    const done = system.stop(target);
    runSpin(system, events);
    await done;
    for (const cell of grid.visibleCells) {
      expect(grid.symbolAt(cell)).toBe(target[cell.reelIndex]?.[cell.rowIndex]);
    }
  });

  it('updates the grid before telling that a reel stopped', () => {
    const { events, grid, system } = createSystem();
    const seen: string[] = [];
    events.on('reelStopped', ({ reelIndex }) =>
      seen.push(grid.symbolAt({ reelIndex, rowIndex: 0 })),
    );
    system.start();
    void system.stop(target);
    runSpin(system, events);
    expect(seen).toEqual(['x', 'a', 'x']);
  });

  it('completes the spin once, after the last reel', async () => {
    const { events, system } = createSystem();
    const onCompleted = vi.fn();
    const order: string[] = [];
    events.on('reelStopped', () => order.push('reel'));
    events.on('spinCompleted', () => {
      onCompleted();
      order.push('spin');
    });
    system.start();
    const done = system.stop(target);
    runSpin(system, events);
    await expect(done).resolves.toBeUndefined();
    expect(onCompleted).toHaveBeenCalledOnce();
    expect(order).toEqual(['reel', 'reel', 'reel', 'spin']);
  });

  it('stops a late stop() right away, still one by one', () => {
    const { events, system } = createSystem();
    system.start();
    for (let ms = 0; ms < 3_000; ms += 16) {
      system.update(16);
    }
    void system.stop(target);
    const { stops } = runSpin(system, events);
    expect(stops[0]?.ms).toBeLessThan(settings.decelerateMs + settings.bounceMs + 100);
  });

  it('hurries the stop: no minimumSpinMs, quickStopDelayMs apart, same landing', async () => {
    const { events, grid, system } = createSystem();
    system.start();
    const done = system.stop(target);
    system.hurry();
    const { stops } = runSpin(system, events);
    await done;
    const [first, second] = stops.map((stop) => stop.ms);
    expect(first).toBeLessThan(settings.minimumSpinMs + settings.decelerateMs);
    expect((second ?? 0) - (first ?? 0)).toBeLessThan(settings.quickStopDelayMs + 45);
    expect(grid.columns).toEqual(target);
  });

  it('applies a hurry that comes before stop() to the coming stop', () => {
    const { events, system } = createSystem();
    system.start();
    system.hurry();
    system.update(16);
    void system.stop(target);
    const { stops } = runSpin(system, events);
    expect(stops[0]?.ms).toBeLessThan(settings.minimumSpinMs + settings.decelerateMs);
  });

  it('cancels a spin onto the field it started from', async () => {
    const { events, grid, system } = createSystem();
    const before = grid.columns;
    system.start();
    const cancelled = system.cancel();
    runSpin(system, events);
    await cancelled;
    expect(grid.columns).toEqual(before);
  });

  it('lets a cancel wait for a stop that is already on its way', async () => {
    const { events, grid, system } = createSystem();
    system.start();
    void system.stop(target);
    const cancelled = system.cancel();
    runSpin(system, events);
    await cancelled;
    expect(grid.columns).toEqual(target);
  });

  it('does nothing on hurry or cancel at rest', async () => {
    const { system } = createSystem();
    system.hurry();
    await expect(system.cancel()).resolves.toBeUndefined();
    expect(system.isSpinning).toBe(false);
  });

  it('spins again from where it stopped, many times in a row', async () => {
    const { events, grid, system } = createSystem();
    const targets: TestSymbol[][][] = [target, strips.map((strip) => strip.slice(0, 2)), target];
    for (const next of targets) {
      system.start();
      const done = system.stop(next);
      runSpin(system, events);
      await done;
      expect(grid.visibleCells.map((cell) => grid.symbolAt(cell))).toEqual(next.flat());
    }
  });

  it('refuses to start twice or to stop reels that are not spinning', () => {
    const { system } = createSystem();
    expect(() => system.stop(target)).toThrow(/needs spinning reels/);
    system.start();
    expect(() => {
      system.start();
    }).toThrow('ReelMotionSystem: the reels are already spinning');
    void system.stop(target);
    expect(() => system.stop(target)).toThrow(/without a target yet/);
  });

  it('checks the size of the target and the strips', () => {
    const { system } = createSystem();
    system.start();
    expect(() => system.stop([['x', 'x']])).toThrow('stop() needs 3 reels of 2 symbols');
    const world = new World();
    const grid = new ReelGrid<TestSymbol>(
      world,
      size,
      strips.map((strip) => strip.slice(0, 2)),
    );
    const events = new EventBus<GameEvents>();
    expect(() => new ReelMotionSystem(world, grid, strips.slice(1), settings, events)).toThrow(
      'expected 3 reel strips, got 2',
    );
    expect(() => new ReelMotionSystem(world, grid, [['a'], [], ['b']], settings, events)).toThrow(
      'reel strip 1 is empty',
    );
    expect(
      () => new ReelMotionSystem(world, grid, strips, { ...settings, bounce: 5 }, events),
    ).toThrow(/bounce/);
  });
});
