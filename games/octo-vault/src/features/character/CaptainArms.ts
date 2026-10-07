import { Graphics, type Container, type Ticker } from 'pixi.js';
import {
  easeInQuad,
  easeOutCubic,
  easeOutQuad,
  tween,
  wait,
  type CellPosition,
  type ReelGridView,
} from 'slot-sdk';
import type { CaptainArmLook } from '../../config/character.config';

type Point = { x: number; y: number };
/** A tween or a wait of the SDK: awaited, or finished early. */
type Motion = PromiseLike<void> & { finish(): void };

/** Points along a drawn tentacle: enough for a smooth curve across the whole field. */
const samples = 28;

/** A tentacle of the captain that can reach out, and where it leaves his coat. */
export interface ArmSource {
  /** The tentacle layer the arm stands for; tucked away while the arm is out. */
  readonly part: Container;
  /** The body it grows from, and the point of the body (in its pixels) it starts at. */
  readonly body: Container;
  readonly from: Point;
}

interface Arm extends ArmSource {
  readonly graphics: Graphics;
  /** 0 at the body, 1 at the cell. */
  progress: number;
  /** 0 open, 1 wrapped around the cell. */
  coil: number;
  target: CellPosition | null;
  /** What moves the arm now: finished at once when the arm is sent out again. */
  motion: Motion | null;
  /** Counts reaches, so the end of an older one does not touch a newer one. */
  reaches: number;
}

/**
 * The captain's own tentacles in the Grab. Each grabbed cell gets a tentacle that grows from
 * under the captain's coat to that very cell, coils around it and pulls back after the cell has
 * turned. The cells come from the round script, as before; this only draws. Tentacles take
 * turns, so several grabs in a row reach out together.
 */
export class CaptainArms {
  private readonly arms: Arm[];
  private turn = 0;

  constructor(
    private readonly ticker: Ticker,
    /** Where the arms are drawn: over the reels, in design coordinates like the captain. */
    private readonly layer: Container,
    private readonly field: Pick<ReelGridView, 'container' | 'cellCenter'>,
    sources: readonly ArmSource[],
    private readonly look: CaptainArmLook & { cellWidth: number },
  ) {
    this.arms = sources.map((source) => {
      const graphics = new Graphics({ label: `arm:${source.part.label}` });
      layer.addChild(graphics);
      return { ...source, graphics, progress: 0, coil: 0, target: null, motion: null, reaches: 0 };
    });
    ticker.add(this.draw);
  }

  /**
   * Grows the next tentacle to `to` and resolves once it is there, so the cell turns as it is
   * grabbed. Coiling and pulling back go on afterwards. Skip lands it at once.
   */
  async reach(to: CellPosition, skip: AbortSignal): Promise<void> {
    const arm = this.arms[this.turn % this.arms.length];
    if (!arm) {
      return;
    }
    this.turn += 1;
    arm.motion?.finish();
    arm.reaches += 1;
    const reach = arm.reaches;
    Object.assign(arm, { target: to, progress: 0, coil: 0 });
    arm.part.visible = false;
    const growing = this.move(arm, { progress: 1 }, this.look.reachMs, easeOutCubic);
    const land = (): void => {
      growing.finish();
    };
    skip.addEventListener('abort', land, { once: true });
    if (skip.aborted) {
      land();
    }
    await growing;
    skip.removeEventListener('abort', land);
    void this.release(arm, reach);
  }

  /**
   * Pulls back quickly every arm still out, e.g. when the wins come on screen: the tentacles
   * must not lie over the win lines.
   */
  pullBack(): void {
    for (const arm of this.arms) {
      if (arm.target) {
        arm.reaches += 1;
        arm.motion?.finish();
        const reach = arm.reaches;
        void this.move(arm, { progress: 0, coil: 0 }, this.look.pullBackMs, easeInQuad).then(() => {
          this.putAway(arm, reach);
        });
      }
    }
  }

  /** Pulls every arm back at once and leaves the ticker. Safe to call twice. */
  destroy(): void {
    this.ticker.remove(this.draw);
    for (const arm of this.arms) {
      arm.reaches += 1;
      arm.motion?.finish();
      arm.part.visible = true;
      arm.graphics.destroy();
    }
    this.arms.length = 0;
  }

  /** Coils, holds, pulls back and brings the tentacle layer back. */
  private async release(arm: Arm, reach: number): Promise<void> {
    const { curlMs, holdMs, retractMs } = this.look;
    const steps: (() => Motion)[] = [
      () => this.move(arm, { coil: 1 }, curlMs, easeOutQuad),
      () => {
        arm.motion = wait(this.ticker, holdMs);
        return arm.motion;
      },
      () => this.move(arm, { progress: 0, coil: 0 }, retractMs, easeInQuad),
    ];
    for (const step of steps) {
      await step();
      if (arm.reaches !== reach) {
        return;
      }
    }
    this.putAway(arm, reach);
  }

  /** The arm is back: the tentacle layer shows again, unless the arm went out anew meanwhile. */
  private putAway(arm: Arm, reach: number): void {
    if (arm.reaches !== reach) {
      return;
    }
    arm.target = null;
    arm.motion = null;
    arm.part.visible = true;
  }

  private move(
    arm: Arm,
    to: { progress?: number; coil?: number },
    duration: number,
    easing: (t: number) => number,
  ): Motion {
    const motion = tween(this.ticker, arm, to, { duration, easing });
    arm.motion = motion;
    return motion;
  }

  private readonly draw = (): void => {
    for (const arm of this.arms) {
      arm.graphics.clear();
      if (arm.target && arm.progress > 0) {
        this.drawArm(arm, arm.target);
      }
    }
  };

  private drawArm(arm: Arm, target: CellPosition): void {
    const toLayer = (from: Container, point: Point): Point =>
      this.layer.toLocal(from.toGlobal(point));
    const start = toLayer(arm.body, arm.from);
    const cell = this.field.cellCenter(target);
    const end = toLayer(this.field.container, cell);
    // Body pixels in layer units: the layout scales the captain.
    const unit = distance(toLayer(arm.body, { x: 1, y: 0 }), toLayer(arm.body, { x: 0, y: 0 }));
    const edge = toLayer(this.field.container, {
      x: cell.x + this.look.cellWidth * this.look.coil,
      y: cell.y,
    });
    const body = tentacleBody(curve(start, end, this.look.bend, arm.progress), this.look, unit);
    drawTentacle(arm.graphics, body, this.look, unit);
    if (arm.coil > 0) {
      drawCoil(arm.graphics, end, distance(edge, end), arm.coil, this.look, unit);
    }
  }
}

function distance(a: Point, b: Point): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

/** Points of the bowed curve from `start` toward `end`, as far as `progress` has grown. */
function curve(start: Point, end: Point, bend: number, progress: number): Point[] {
  const control = {
    x: (start.x + end.x) / 2 + (end.y - start.y) * bend,
    y: (start.y + end.y) / 2 - (end.x - start.x) * bend,
  };
  return Array.from({ length: samples + 1 }, (_, index) => {
    const t = (index / samples) * progress;
    const rest = 1 - t;
    return {
      x: rest * rest * start.x + 2 * rest * t * control.x + t * t * end.x,
      y: rest * rest * start.y + 2 * rest * t * control.y + t * t * end.y,
    };
  });
}

/** Along the curve: each point, the side direction and the half width there. */
interface Section {
  point: Point;
  normal: Point;
  half: number;
}

function tentacleBody(points: Point[], look: CaptainArmLook, unit: number): Section[] {
  return points.map((point, index) => {
    const next = points[Math.min(index + 1, points.length - 1)] ?? point;
    const previous = points[Math.max(index - 1, 0)] ?? point;
    const length = distance(next, previous) || 1;
    const share = index / (points.length - 1);
    const half = ((look.rootWidth + (look.tipWidth - look.rootWidth) * share) * unit) / 2;
    return {
      point,
      normal: { x: -(next.y - previous.y) / length, y: (next.x - previous.x) / length },
      half,
    };
  });
}

/** The line along the tentacle at `side` of its half width: 1 one edge, -1 the other. */
function edgeAt(sections: Section[], side: number, widen = 0): Point[] {
  return sections.map(({ point, normal, half }) => ({
    x: point.x + normal.x * (half + widen) * side,
    y: point.y + normal.y * (half + widen) * side,
  }));
}

function band(left: Point[], right: Point[]): number[] {
  return [...left, ...right.reverse()].flatMap(({ x, y }) => [x, y]);
}

/** A glossy red tentacle: outline, shaded underside, a highlight and gold ring suckers. */
function drawTentacle(
  graphics: Graphics,
  sections: Section[],
  look: CaptainArmLook,
  unit: number,
): void {
  const { colors } = look;
  const outline = look.outline * unit;
  graphics
    .poly(band(edgeAt(sections, 1, outline), edgeAt(sections, -1, outline)))
    .fill(colors.outline);
  graphics.poly(band(edgeAt(sections, 1), edgeAt(sections, -1))).fill(colors.skin);
  graphics
    .poly(band(edgeAt(sections, 0.15), edgeAt(sections, 1)))
    .fill({ color: colors.shade, alpha: 0.55 });
  const tip = sections[sections.length - 1];
  if (tip) {
    graphics.circle(tip.point.x, tip.point.y, tip.half + outline).fill(colors.outline);
    graphics.circle(tip.point.x, tip.point.y, tip.half).fill(colors.skin);
  }
  const shine = edgeAt(sections, -0.5).slice(1, -4);
  shine.forEach(({ x, y }, index) => (index === 0 ? graphics.moveTo(x, y) : graphics.lineTo(x, y)));
  graphics.stroke({ color: colors.shine, width: 6 * unit, alpha: 0.7, cap: 'round' });
  drawSuckers(graphics, sections, look, unit);
}

/** Gold rings along the underside, smaller toward the tip, like the v3 tentacles. */
function drawSuckers(
  graphics: Graphics,
  sections: Section[],
  look: CaptainArmLook,
  unit: number,
): void {
  const { colors } = look;
  sections.forEach(({ point, normal, half }, index) => {
    if (index < 2 || index % 2 !== 0 || index > sections.length - 3) {
      return;
    }
    const center = { x: point.x + normal.x * half * 0.62, y: point.y + normal.y * half * 0.62 };
    const radius = half * 0.38;
    graphics
      .circle(center.x, center.y, radius)
      .fill(colors.sucker)
      .stroke({ color: colors.suckerRim, width: 1.5 * unit });
    graphics.circle(center.x, center.y, radius * 0.45).fill(colors.suckerHollow);
  });
}

/** The tip wrapped `share` of the way around the grabbed cell. */
function drawCoil(
  graphics: Graphics,
  center: Point,
  radius: number,
  share: number,
  look: CaptainArmLook,
  unit: number,
): void {
  const start = -Math.PI / 2;
  const end = start + share * Math.PI * 1.75;
  const width = look.tipWidth * 1.6 * unit;
  const arc = (): Graphics =>
    graphics
      .moveTo(center.x + Math.cos(start) * radius, center.y + Math.sin(start) * radius)
      .arc(center.x, center.y, radius, start, end);
  arc().stroke({
    color: look.colors.outline,
    width: width + look.outline * 2 * unit,
    cap: 'round',
  });
  arc().stroke({ color: look.colors.skin, width, cap: 'round' });
  arc().stroke({ color: look.colors.shine, width: width * 0.3, alpha: 0.6, cap: 'round' });
}
