import type { CharacterActor } from 'slot-sdk';

/** Moments of the game the character acts out. The config maps each to an animation name. */
export type CharacterMoment = 'idle' | 'spin' | 'anticipation' | 'grab' | 'win' | 'bigWin';

/**
 * What the director needs of an actor: animations by name. `CharacterActor` has it, a Spine
 * actor would have the same; a test passes a fake.
 */
export type Actor = Pick<CharacterActor, 'play' | 'queue' | 'has'>;

/** Moments that play once and hand back to the loop underneath. */
type Gesture = Extract<CharacterMoment, 'grab' | 'win'>;
/** Moments that loop for as long as the game stays in them. */
type Mood = Exclude<CharacterMoment, Gesture>;

/**
 * Decides what the character plays. It keeps a mood that loops (idle, spin, anticipation or
 * Big Win, from what the round is doing) and plays gestures (grab, win) once on top of it,
 * queuing the mood to come back after them. The round state stays with the game: the director
 * only listens, and nothing waits for the character.
 */
export class CharacterDirector {
  private spinning = false;
  private anticipating = false;
  private bigWin = false;
  /** The mood looping now, or null while a gesture plays. */
  private looping: Mood | null = null;
  /** The gesture playing now; a new object per gesture, so a late finish of an old one is ignored. */
  private gesture: { mood: Mood } | null = null;

  constructor(
    private readonly actor: Actor,
    private readonly animations: Readonly<Record<CharacterMoment, string>>,
  ) {
    const missing = Object.values(animations).filter((name) => !actor.has(name));
    if (missing.length > 0) {
      throw new Error(`CharacterDirector: the skeleton has no animation ${missing.join(', ')}`);
    }
    this.settle();
  }

  spinStarted(): void {
    this.spinning = true;
    this.anticipating = false;
    this.settle();
  }

  /** A reel spins on in suspense. Ends with the spin, also when Stop cuts it short. */
  anticipationStarted(): void {
    this.anticipating = this.spinning;
    this.settle();
  }

  spinCompleted(): void {
    this.spinning = false;
    this.anticipating = false;
    this.settle();
  }

  /** A tentacle reaches for a cell. Each one restarts the grab, so the swing meets every reach. */
  grab(): void {
    this.perform('grab');
  }

  /** Line wins are on screen. A Big Win already playing outranks it. */
  win(): void {
    if (!this.bigWin) {
      this.perform('win');
    }
  }

  /** A Big Win level is on screen; the next level restarts the celebration. */
  bigWinShown(): void {
    this.bigWin = true;
    this.gesture = null;
    this.looping = 'bigWin';
    void this.actor.play(this.animations.bigWin, { loop: true });
  }

  bigWinEnded(): void {
    this.bigWin = false;
    this.settle();
  }

  /** The round is back in idle, also after a failed round: nothing of it may stay. */
  roundIdle(): void {
    this.spinning = false;
    this.anticipating = false;
    this.bigWin = false;
    this.settle();
  }

  private mood(): Mood {
    if (this.bigWin) {
      return 'bigWin';
    }
    if (this.anticipating) {
      return 'anticipation';
    }
    return this.spinning ? 'spin' : 'idle';
  }

  /** Loops the current mood; during a gesture, makes it the one that follows the gesture. */
  private settle(): void {
    const mood = this.mood();
    if (this.gesture) {
      this.gesture.mood = mood;
      void this.actor.queue(this.animations[mood], { loop: true });
      return;
    }
    if (this.looping !== mood) {
      this.looping = mood;
      void this.actor.play(this.animations[mood], { loop: true });
    }
  }

  private perform(name: Gesture): void {
    const gesture = { mood: this.mood() };
    this.gesture = gesture;
    this.looping = null;
    void this.actor.play(this.animations[name]).then(() => {
      // The actor has moved on to the queued mood by itself, unless something replaced the gesture.
      if (this.gesture === gesture) {
        this.gesture = null;
        this.looping = gesture.mood;
      }
    });
    void this.actor.queue(this.animations[gesture.mood], { loop: true });
  }
}
