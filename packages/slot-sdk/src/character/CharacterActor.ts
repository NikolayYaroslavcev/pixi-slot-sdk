import type { Container, Ticker } from 'pixi.js';
import { posePart, type CharacterAnimation, type PartTransform, type Pose } from './characterPose';
import {
  CharacterAnimationState,
  type AnimationEnd,
  type AnimationOptions,
} from './CharacterAnimationState';

/** What a `CharacterActor` moves and how: the parts, named animations and the ticker. */
export interface CharacterActorOptions<Part extends string> {
  /** The whole character; the layout places it. The actor destroys it. */
  view: Container;
  /** The parts animations move, each already in its rest pose. */
  parts: Readonly<Record<Part, Container>>;
  /** Animations by name. The game decides which name answers which moment. */
  animations: Readonly<Record<string, CharacterAnimation<Part>>>;
  /** The game ticker: the character moves with it and stops with it on a hidden tab. */
  ticker: Ticker;
  /** Crossfade between animations, in milliseconds. Default 200. */
  mixMs?: number;
}

const DEFAULT_MIX_MS = 200;

/**
 * A character drawn as separate parts (body, eyes, limbs) that plays animations by name.
 * One animation plays at a time and at most one waits after it; switching crossfades. It knows
 * nothing of a game: which animation answers which event is the game's decision. The calls are
 * the same as a Spine character's would be, so a skeleton can replace the parts later without
 * changes to the code that drives it.
 *
 * ```ts
 * const actor = new CharacterActor({ view, parts, animations, ticker: app.ticker });
 * actor.play('idle', { loop: true });
 * await actor.play('jump');            // resolves when the jump has played to its end
 * actor.queue('idle', { loop: true });  // or: play idle as soon as the jump ends
 * ```
 */
export class CharacterActor<Part extends string = string> {
  readonly view: Container;
  private readonly state: CharacterAnimationState;
  private readonly rest = new Map<Part, PartTransform>();
  private destroyed = false;

  constructor(private readonly options: CharacterActorOptions<Part>) {
    this.view = options.view;
    const durations = Object.entries(options.animations).map(
      ([name, animation]) => [name, animation.durationMs] as const,
    );
    this.state = new CharacterAnimationState(new Map(durations), options.mixMs ?? DEFAULT_MIX_MS);
    for (const [part, container] of this.partEntries()) {
      this.rest.set(part, transformOf(container));
    }
    options.ticker.add(this.update);
  }

  /** Names of the animations the actor has. */
  get animations(): readonly string[] {
    return this.state.names;
  }

  /** The animation on screen now, or null before the first `play` and after `stop`. */
  get current(): string | null {
    return this.state.currentName;
  }

  /** The container of a part, e.g. to find where a limb starts. Animations own its transform. */
  part(name: Part): Container {
    return this.options.parts[name];
  }

  has(name: string): boolean {
    return this.state.has(name);
  }

  /**
   * Plays `name` now, replacing what plays and what waits. Resolves `completed` when a non-looping
   * animation reaches its end, `interrupted` when something replaces or stops it first. A looping
   * one only ends interrupted. Throws for a name the actor does not have.
   */
  play(name: string, options?: AnimationOptions): Promise<AnimationEnd> {
    this.checkAlive(name);
    return this.state.play(name, options);
  }

  /**
   * Plays `name` once the current animation ends (a looping one: at the end of its current pass),
   * crossfading into it. Replaces an animation that was already waiting. With nothing playing,
   * starts now. Resolves like `play`.
   */
  queue(name: string, options?: AnimationOptions): Promise<AnimationEnd> {
    this.checkAlive(name);
    return this.state.queue(name, options);
  }

  /** Stops every animation and puts the parts back in their rest pose. Pending calls resolve `interrupted`. */
  stop(): void {
    this.state.stop();
    this.applyPose();
  }

  /** Stops, leaves the ticker and destroys the view with its parts. Safe to call twice. */
  destroy(): void {
    if (this.destroyed) {
      return;
    }
    this.destroyed = true;
    this.state.stop();
    this.options.ticker.remove(this.update);
    this.view.destroy({ children: true });
  }

  private readonly update = (ticker: Ticker): void => {
    this.state.update(ticker.deltaMS);
    this.applyPose();
  };

  private applyPose(): void {
    const poses: { pose: Pose<Part>; weight: number }[] = this.state.active.map(
      ({ name, timeMs, weight }) => ({ pose: this.animation(name).pose(timeMs), weight }),
    );
    for (const [part, container] of this.partEntries()) {
      const rest = this.rest.get(part);
      if (rest) {
        const posed = posePart(
          rest,
          poses.map(({ pose, weight }) => ({ pose: pose[part], weight })),
        );
        setTransform(container, posed);
      }
    }
  }

  private animation(name: string): CharacterAnimation<Part> {
    const animation = this.options.animations[name];
    if (!animation) {
      throw new Error(`CharacterActor: no animation "${name}"`);
    }
    return animation;
  }

  private partEntries(): [Part, Container][] {
    return Object.entries(this.options.parts) as [Part, Container][];
  }

  private checkAlive(name: string): void {
    if (this.destroyed) {
      throw new Error(`CharacterActor: cannot play "${name}", the actor is destroyed`);
    }
  }
}

function transformOf(container: Container): PartTransform {
  const { x, y, rotation, alpha } = container;
  return { x, y, rotation, alpha, scaleX: container.scale.x, scaleY: container.scale.y };
}

function setTransform(container: Container, transform: PartTransform): void {
  container.position.set(transform.x, transform.y);
  container.rotation = transform.rotation;
  container.scale.set(transform.scaleX, transform.scaleY);
  container.alpha = transform.alpha;
}
