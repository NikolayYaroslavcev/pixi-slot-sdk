/** How a call to `play` or `queue` ended: played to its last frame, or replaced or stopped first. */
export type AnimationEnd = 'completed' | 'interrupted';

/** How one call to `play` or `queue` plays its animation. */
export interface AnimationOptions {
  /** Repeat until something else plays. Default false. */
  loop?: boolean;
  /** Milliseconds of crossfade from the animation before. Default: the state's own. */
  mixMs?: number;
}

/** An animation on screen now: which, how far into its pass, and how much it counts. */
export interface ActiveAnimation {
  readonly name: string;
  readonly timeMs: number;
  /** Share in the pose; the active animations add up to 1. Below 1 only during a crossfade. */
  readonly weight: number;
}

interface Track {
  readonly name: string;
  readonly durationMs: number;
  readonly loop: boolean;
  readonly mixMs: number;
  timeMs: number;
  /** Resolves the caller's promise; later calls change nothing. */
  readonly settle: (end: AnimationEnd) => void;
}

/**
 * Which animation of a character plays, without drawing anything: the same rules as a Spine
 * track. One animation plays, at most one waits after it, and a switch crossfades for `mixMs`.
 * A non-looping animation holds its last frame until something else plays.
 */
export class CharacterAnimationState {
  private current: Track | null = null;
  /** The animation fading out during a crossfade. */
  private previous: Track | null = null;
  private next: Track | null = null;
  private mixedMs = 0;

  /** `durations`: the length of one pass of each animation, by name. Each must be positive. */
  constructor(
    private readonly durations: ReadonlyMap<string, number>,
    private readonly mixMs: number,
  ) {
    for (const [name, durationMs] of durations) {
      if (!(durationMs > 0)) {
        throw new Error(`CharacterAnimationState: animation "${name}" must last longer than 0 ms`);
      }
    }
  }

  get names(): readonly string[] {
    return [...this.durations.keys()];
  }

  /** The animation playing now, or null before the first `play` and after `stop`. */
  get currentName(): string | null {
    return this.current?.name ?? null;
  }

  has(name: string): boolean {
    return this.durations.has(name);
  }

  /** Plays `name` now, replacing what plays and what waits. See `CharacterActor.play`. */
  play(name: string, options: AnimationOptions = {}): Promise<AnimationEnd> {
    const { track, done } = this.createTrack(name, options);
    this.next?.settle('interrupted');
    this.next = null;
    this.switchTo(track);
    return done;
  }

  /** Plays `name` when the current pass ends. See `CharacterActor.queue`. */
  queue(name: string, options: AnimationOptions = {}): Promise<AnimationEnd> {
    if (!this.current) {
      return this.play(name, options);
    }
    const { track, done } = this.createTrack(name, options);
    this.next?.settle('interrupted');
    this.next = track;
    return done;
  }

  /** Stops everything; pending calls resolve `interrupted`. */
  stop(): void {
    for (const track of [this.current, this.previous, this.next]) {
      track?.settle('interrupted');
    }
    this.current = null;
    this.previous = null;
    this.next = null;
  }

  /** Moves time on by `deltaMs`: ends passes, starts what waits and fades out the previous animation. */
  update(deltaMs: number): void {
    const current = this.current;
    if (!current) {
      return;
    }
    current.timeMs += deltaMs;
    this.mixedMs += deltaMs;
    if (this.previous) {
      this.previous.timeMs += deltaMs;
      if (this.mixedMs >= current.mixMs) {
        this.previous = null;
      }
    }
    if (current.timeMs < current.durationMs) {
      return;
    }
    if (!current.loop) {
      current.settle('completed');
    }
    if (this.next) {
      const next = this.next;
      this.next = null;
      this.switchTo(next);
    }
  }

  /** What to pose now, with weights. Empty when nothing plays. */
  get active(): readonly ActiveAnimation[] {
    const current = this.current;
    if (!current) {
      return [];
    }
    if (!this.previous) {
      return [{ name: current.name, timeMs: passTime(current), weight: 1 }];
    }
    const weight = Math.min(1, this.mixedMs / current.mixMs);
    return [
      { name: this.previous.name, timeMs: passTime(this.previous), weight: 1 - weight },
      { name: current.name, timeMs: passTime(current), weight },
    ];
  }

  private switchTo(track: Track): void {
    this.current?.settle('interrupted');
    this.previous = track.mixMs > 0 ? this.current : null;
    this.current = track;
    this.mixedMs = 0;
  }

  private createTrack(
    name: string,
    options: AnimationOptions,
  ): { track: Track; done: Promise<AnimationEnd> } {
    const durationMs = this.durations.get(name);
    if (durationMs === undefined) {
      throw new Error(
        `CharacterAnimationState: no animation "${name}". It has: ${this.names.join(', ')}`,
      );
    }
    let settle: (end: AnimationEnd) => void = () => undefined;
    const done = new Promise<AnimationEnd>((resolve) => {
      settle = resolve;
    });
    const track = {
      name,
      durationMs,
      loop: options.loop ?? false,
      mixMs: options.mixMs ?? this.mixMs,
      timeMs: 0,
      settle,
    };
    return { track, done };
  }
}

/** Time within the pass: a loop wraps, a finished animation holds its last frame. */
function passTime(track: Track): number {
  return track.loop ? track.timeMs % track.durationMs : Math.min(track.timeMs, track.durationMs);
}
