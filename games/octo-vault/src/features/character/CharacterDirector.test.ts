import type { AnimationEnd, AnimationOptions } from 'slot-sdk';
import { describe, expect, it } from 'vitest';
import { characterConfig } from '../../config/character.config';
import { CharacterDirector, type Actor, type CharacterMoment } from './CharacterDirector';

/** Plays like `CharacterActor`: one animation plays, one waits, and a finished one hands over. */
class FakeActor implements Actor {
  playing: { name: string; loop: boolean } | null = null;
  waiting: { name: string; loop: boolean } | null = null;
  readonly calls: string[] = [];
  private finish: ((end: AnimationEnd) => void) | null = null;

  constructor(private readonly names: readonly string[]) {}

  has(name: string): boolean {
    return this.names.includes(name);
  }

  play(name: string, options: AnimationOptions = {}): Promise<AnimationEnd> {
    this.finish?.('interrupted');
    this.calls.push(`play ${name}`);
    this.playing = { name, loop: options.loop ?? false };
    this.waiting = null;
    return new Promise((resolve) => (this.finish = resolve));
  }

  queue(name: string, options: AnimationOptions = {}): Promise<AnimationEnd> {
    this.calls.push(`queue ${name}`);
    this.waiting = { name, loop: options.loop ?? false };
    return Promise.resolve('interrupted');
  }

  /** The non-looping animation reaches its end and the waiting one takes over. */
  async complete(): Promise<void> {
    this.finish?.('completed');
    this.finish = null;
    this.playing = this.waiting;
    this.waiting = null;
    await Promise.resolve();
  }
}

const animations = characterConfig.animations;
const name = (moment: CharacterMoment): string => animations[moment];

function setUp(): { actor: FakeActor; director: CharacterDirector } {
  const actor = new FakeActor(Object.values(animations));
  return { actor, director: new CharacterDirector(actor, animations) };
}

describe('CharacterDirector', () => {
  it('maps every moment to an animation of the octopus skeleton', () => {
    expect(animations).toEqual({
      idle: 'idle',
      spin: 'spin',
      anticipation: 'anticipation',
      grab: 'grab',
      win: 'win',
      bigWin: 'bigwin',
    });
  });

  it('starts idle, looping', () => {
    const { actor } = setUp();

    expect(actor.playing).toEqual({ name: name('idle'), loop: true });
  });

  it('refuses a mapping to animations the skeleton does not have', () => {
    const actor = new FakeActor(['idle', 'spin']);

    expect(() => new CharacterDirector(actor, animations)).toThrow(
      'the skeleton has no animation anticipation, grab, win, bigwin',
    );
  });

  it('spins with the reels and goes back to idle when they stop', () => {
    const { actor, director } = setUp();

    director.spinStarted();
    expect(actor.playing).toEqual({ name: name('spin'), loop: true });
    director.spinCompleted();
    expect(actor.playing).toEqual({ name: name('idle'), loop: true });
  });

  it('holds its breath while a reel is anticipated, until the spin ends', () => {
    const { actor, director } = setUp();
    director.spinStarted();

    director.anticipationStarted();
    expect(actor.playing?.name).toBe(name('anticipation'));
    director.anticipationStarted();
    director.spinCompleted();
    expect(actor.playing?.name).toBe(name('idle'));
    expect(actor.calls.filter((call) => call === `play ${name('anticipation')}`)).toHaveLength(1);
  });

  it('ignores anticipation outside a spin', () => {
    const { actor, director } = setUp();

    director.anticipationStarted();

    expect(actor.playing?.name).toBe(name('idle'));
  });

  it('plays a grab once, then the mood it queued comes back', async () => {
    const { actor, director } = setUp();

    director.grab();
    expect(actor.playing).toEqual({ name: name('grab'), loop: false });
    expect(actor.waiting).toEqual({ name: name('idle'), loop: true });
    await actor.complete();
    expect(actor.playing).toEqual({ name: name('idle'), loop: true });

    // Back in a mood: the next spin switches at once.
    director.spinStarted();
    expect(actor.playing?.name).toBe(name('spin'));
  });

  it('restarts the grab for every tentacle', () => {
    const { actor, director } = setUp();

    director.grab();
    director.grab();
    director.grab();

    expect(actor.calls.filter((call) => call === `play ${name('grab')}`)).toHaveLength(3);
    expect(actor.waiting?.name).toBe(name('idle'));
  });

  it('queues the new mood when the round moves on during a gesture', async () => {
    const { actor, director } = setUp();
    director.spinStarted();
    director.win();

    director.spinCompleted();
    expect(actor.playing?.name).toBe(name('win'));
    expect(actor.waiting?.name).toBe(name('idle'));
    await actor.complete();
    expect(actor.playing?.name).toBe(name('idle'));
  });

  it('celebrates a Big Win until its overlay is gone, over a line win', () => {
    const { actor, director } = setUp();
    director.win();

    director.bigWinShown();
    expect(actor.playing).toEqual({ name: name('bigWin'), loop: true });
    director.win();
    expect(actor.playing?.name).toBe(name('bigWin'));
    director.bigWinShown();
    expect(actor.calls.filter((call) => call === `play ${name('bigWin')}`)).toHaveLength(2);
    director.bigWinEnded();
    expect(actor.playing).toEqual({ name: name('idle'), loop: true });
  });

  it('a finished gesture that was replaced does not take over', async () => {
    const { actor, director } = setUp();
    director.win();
    const wonAt = actor.calls.length;

    director.bigWinShown();
    await Promise.resolve();
    director.bigWinEnded();

    expect(actor.calls.slice(wonAt)).toEqual([`play ${name('bigWin')}`, `play ${name('idle')}`]);
  });

  it('drops everything of the round when it is back in idle', () => {
    const { actor, director } = setUp();
    director.spinStarted();
    director.anticipationStarted();
    director.bigWinShown();

    director.roundIdle();

    expect(actor.playing).toEqual({ name: name('idle'), loop: true });
  });

  it('asks for the same animations every round, with nothing piling up', async () => {
    const { actor, director } = setUp();
    const playRound = async (): Promise<void> => {
      director.spinStarted();
      director.spinCompleted();
      director.grab();
      await actor.complete();
      director.win();
      await actor.complete();
      director.roundIdle();
    };
    await playRound();
    const firstRound = actor.calls.length;

    for (let round = 0; round < 20; round++) {
      await playRound();
    }

    expect(actor.calls.length).toBe(firstRound + 20 * (firstRound - 1));
    expect(actor.playing).toEqual({ name: name('idle'), loop: true });
    expect(actor.waiting).toBeNull();
  });
});
