import type { Ticker } from 'pixi.js';
import { linear, type Easing } from './easing';

/** Keys of `Target` whose values are numbers, e.g. `x`, `alpha`, `rotation` of a Container. */
type NumericKey<Target> = {
  [Key in keyof Target]: Target[Key] extends number ? Key : never;
}[keyof Target];

/** End values of the animated properties. */
export type TweenProps<Target> = Partial<Pick<Target, NumericKey<Target>>>;

export interface TweenOptions {
  /** Milliseconds of ticker time. */
  duration: number;
  /** Defaults to `linear`. */
  easing?: Easing;
}

/**
 * A running animation. Await it to wait for the end, or call `finish()` to jump
 * to the end values right away (e.g. when the player skips an animation).
 */
export class Tween<Target extends object> implements PromiseLike<void> {
  private elapsedMs = 0;
  private readonly startValues: TweenProps<Target>;
  private readonly done: Promise<void>;
  private resolveDone: () => void = () => undefined;

  constructor(
    private readonly ticker: Ticker,
    private readonly target: Target,
    private readonly endValues: TweenProps<Target>,
    private readonly options: TweenOptions,
  ) {
    this.startValues = pickValues(target, endValues);
    this.done = new Promise((resolve) => {
      this.resolveDone = resolve;
    });
    if (options.duration <= 0) {
      this.finish();
      return;
    }
    ticker.add(this.update);
  }

  // Makes the tween awaitable like a Promise.
  readonly then: PromiseLike<void>['then'] = (onFulfilled, onRejected) =>
    this.done.then(onFulfilled, onRejected);

  /** Sets the end values and resolves the tween. Calling it again changes nothing. */
  finish(): void {
    this.ticker.remove(this.update);
    this.apply(1);
    this.resolveDone();
  }

  // An arrow function, so the ticker calls it with the right `this`.
  private readonly update = (ticker: Ticker): void => {
    // deltaMS is capped by ticker.minFPS, so one long frame never makes the animation jump.
    this.elapsedMs += ticker.deltaMS;
    if (this.elapsedMs >= this.options.duration) {
      this.finish();
      return;
    }
    const easing = this.options.easing ?? linear;
    this.apply(easing(this.elapsedMs / this.options.duration));
  };

  private apply(easedProgress: number): void {
    for (const key of Object.keys(this.endValues) as NumericKey<Target>[]) {
      const start = this.startValues[key] as number;
      const end = this.endValues[key] as number;
      (this.target[key] as number) = start + (end - start) * easedProgress;
    }
  }
}

/**
 * Animates numeric properties of `target` to `endValues` on the given ticker.
 *
 * ```ts
 * await tween(app.ticker, sprite, { x: 300, alpha: 0 }, { duration: 400, easing: easeOutCubic });
 * ```
 */
export function tween<Target extends object>(
  ticker: Ticker,
  target: Target,
  endValues: TweenProps<Target>,
  options: TweenOptions,
): Tween<Target> {
  return new Tween(ticker, target, endValues, options);
}

/** Resolves after `durationMs` of ticker time. Can be ended early with `finish()`, like a tween. */
export function wait(ticker: Ticker, durationMs: number): Tween<object> {
  return new Tween(ticker, {}, {}, { duration: durationMs });
}

/** Like `wait`, but also ends as soon as `skip` is aborted, or right away if it already is. */
export async function waitUnlessSkipped(
  ticker: Ticker,
  durationMs: number,
  skip: AbortSignal,
): Promise<void> {
  const timer = wait(ticker, durationMs);
  if (skip.aborted) {
    timer.finish();
  }
  skip.addEventListener(
    'abort',
    () => {
      timer.finish();
    },
    { once: true },
  );
  await timer;
}

function pickValues<Target extends object>(
  target: Target,
  endValues: TweenProps<Target>,
): TweenProps<Target> {
  const values: TweenProps<Target> = {};
  for (const key of Object.keys(endValues) as NumericKey<Target>[]) {
    values[key] = target[key];
  }
  return values;
}
