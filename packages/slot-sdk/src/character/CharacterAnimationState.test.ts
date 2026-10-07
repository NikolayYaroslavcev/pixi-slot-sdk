import { describe, expect, it } from 'vitest';
import { CharacterAnimationState } from './CharacterAnimationState';

const durations = new Map([
  ['idle', 1000],
  ['jump', 500],
  ['wave', 400],
]);

const createState = (mixMs = 100): CharacterAnimationState =>
  new CharacterAnimationState(durations, mixMs);

/** Lets promise callbacks run. */
const settled = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 0));

describe('CharacterAnimationState', () => {
  it('lists its animations and plays nothing at first', () => {
    const state = createState();

    expect(state.names).toEqual(['idle', 'jump', 'wave']);
    expect(state.has('jump')).toBe(true);
    expect(state.has('fly')).toBe(false);
    expect(state.currentName).toBeNull();
    expect(state.active).toEqual([]);
  });

  it('refuses an animation of zero length', () => {
    expect(() => new CharacterAnimationState(new Map([['still', 0]]), 0)).toThrow(
      'animation "still" must last longer than 0 ms',
    );
  });

  it('throws for an unknown animation and keeps playing what it played', () => {
    const state = createState();
    void state.play('idle', { loop: true });

    expect(() => state.play('fly')).toThrow('no animation "fly". It has: idle, jump, wave');
    expect(() => state.queue('fly')).toThrow('no animation "fly"');
    expect(state.currentName).toBe('idle');
  });

  it('wraps a loop and holds the last frame of a finished animation', () => {
    const state = createState(0);
    void state.play('idle', { loop: true });
    state.update(1250);
    expect(state.active).toEqual([{ name: 'idle', timeMs: 250, weight: 1 }]);

    void state.play('jump');
    state.update(800);
    expect(state.active).toEqual([{ name: 'jump', timeMs: 500, weight: 1 }]);
    expect(state.currentName).toBe('jump');
  });

  it('crossfades from the previous animation for mixMs', () => {
    const state = createState(100);
    void state.play('idle', { loop: true });
    state.update(300);

    void state.play('wave');
    state.update(25);
    expect(state.active).toEqual([
      { name: 'idle', timeMs: 325, weight: 0.75 },
      { name: 'wave', timeMs: 25, weight: 0.25 },
    ]);
    state.update(100);
    expect(state.active).toEqual([{ name: 'wave', timeMs: 125, weight: 1 }]);
  });

  it('resolves completed at the end of a non-looping animation, not before', async () => {
    const state = createState();
    let end: string | undefined;
    void state.play('jump').then((result) => (end = result));

    state.update(499);
    await settled();
    expect(end).toBeUndefined();
    state.update(1);
    await settled();
    expect(end).toBe('completed');
  });

  it('resolves interrupted when replaced, and a loop only ever ends interrupted', async () => {
    const state = createState();
    const idle = state.play('idle', { loop: true });
    state.update(5000);
    const jump = state.play('jump');
    void state.play('wave');

    await expect(idle).resolves.toBe('interrupted');
    await expect(jump).resolves.toBe('interrupted');
  });

  it('starts the queued animation when the current one completes', async () => {
    const state = createState();
    const jump = state.play('jump');
    void state.queue('idle', { loop: true });

    state.update(300);
    expect(state.currentName).toBe('jump');
    state.update(200);

    await expect(jump).resolves.toBe('completed');
    expect(state.currentName).toBe('idle');
  });

  it('starts the queued animation at the end of the current loop pass', () => {
    const state = createState();
    void state.play('idle', { loop: true });
    state.update(600);

    void state.queue('wave');
    state.update(300);
    expect(state.currentName).toBe('idle');
    state.update(100);
    expect(state.currentName).toBe('wave');
  });

  it('keeps only the last queued animation waiting', async () => {
    const state = createState();
    void state.play('jump');
    const first = state.queue('wave');
    void state.queue('idle', { loop: true });

    state.update(500);

    await expect(first).resolves.toBe('interrupted');
    expect(state.currentName).toBe('idle');
  });

  it('plays a queued animation at once when nothing plays', () => {
    const state = createState();

    void state.queue('idle', { loop: true });

    expect(state.currentName).toBe('idle');
  });

  it('stops everything and resolves what was pending', async () => {
    const state = createState();
    const idle = state.play('idle', { loop: true });
    const queued = state.queue('jump');

    state.stop();
    state.update(1000);

    await expect(idle).resolves.toBe('interrupted');
    await expect(queued).resolves.toBe('interrupted');
    expect(state.currentName).toBeNull();
    expect(state.active).toEqual([]);
  });
});
