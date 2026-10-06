import { Graphics, type ColorSource, type Ticker } from 'pixi.js';
import { easeOutQuad, tween, type CellPosition, type ReelGridView } from 'slot-sdk';

/** Look of a tentacle. Sizes are design pixels of the field. */
export interface TentacleLook {
  color: ColorSource;
  width: number;
  /** Time a tentacle takes to reach its cell. */
  growMs: number;
  /** How far the tentacle bends sideways, as a share of its length. */
  bend: number;
}

type Point = { x: number; y: number };

/** Points along a tentacle; enough for a smooth curve at any field size. */
const segments = 16;

/**
 * Draws tentacles growing from an Octopus to the cells it grabs. A placeholder look until
 * the final art (stage 11): a bent, tapering stroke with a sucker at its tip.
 */
export class TentacleView {
  readonly graphics = new Graphics();

  constructor(
    private readonly ticker: Ticker,
    private readonly field: ReelGridView,
    private readonly look: TentacleLook,
  ) {}

  /** Grows one tentacle and resolves when it has reached `to`. Ends at once when `skip` is aborted. */
  async reach(from: CellPosition, to: CellPosition, skip: AbortSignal): Promise<void> {
    const start = this.field.cellCenter(from);
    const end = this.field.cellCenter(to);
    const growth = { progress: 0 };
    const draw = (): void => {
      this.draw(start, end, growth.progress);
    };
    const growing = tween(
      this.ticker,
      growth,
      { progress: 1 },
      { duration: this.look.growMs, easing: easeOutQuad },
    );
    const finish = (): void => {
      growing.finish();
    };
    this.ticker.add(draw);
    skip.addEventListener('abort', finish, { once: true });
    try {
      await growing;
    } finally {
      skip.removeEventListener('abort', finish);
      this.ticker.remove(draw);
      this.graphics.clear();
    }
  }

  private draw(start: Point, end: Point, progress: number): void {
    const { color, width } = this.look;
    const bendPoint = bendOf(start, end, this.look.bend);
    this.graphics.clear();
    let tip = start;
    for (let index = 1; index <= segments * progress; index += 1) {
      const next = curvePoint(start, bendPoint, end, index / segments);
      // Thick at the Octopus, thin at the tip.
      const thickness = width * (1 - (0.6 * index) / segments);
      this.graphics
        .moveTo(tip.x, tip.y)
        .lineTo(next.x, next.y)
        .stroke({ color, width: thickness, cap: 'round' });
      tip = next;
    }
    this.graphics.circle(tip.x, tip.y, width * 0.45).fill(color);
  }
}

/** The control point of the curve: off the middle of the straight line, to its side. */
function bendOf(start: Point, end: Point, bend: number): Point {
  const middle = { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 };
  return { x: middle.x - (end.y - start.y) * bend, y: middle.y + (end.x - start.x) * bend };
}

/** A point of the quadratic curve from `start` through `control` to `end`, `t` from 0 to 1. */
function curvePoint(start: Point, control: Point, end: Point, t: number): Point {
  const rest = 1 - t;
  return {
    x: rest * rest * start.x + 2 * rest * t * control.x + t * t * end.x,
    y: rest * rest * start.y + 2 * rest * t * control.y + t * t * end.y,
  };
}
