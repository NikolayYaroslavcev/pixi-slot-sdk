import { defineComponent } from '../ecs/component';
import type { System, World } from '../ecs/World';
import type { CellPosition } from '../reels/components';
import type { ReelGrid } from '../reels/ReelGrid';

/** How winning symbols stand out from the rest of the field. Set by the game. */
export interface HighlightStyle {
  /** Brightness of the symbols that did not win: 0 is black, 1 is unchanged. */
  dimBrightness: number;
  /** Time for a symbol to dim, or to light up again when it wins. */
  fadeMs: number;
  /** A winning symbol grows by this share of its size at the top of a pulse, e.g. 0.1. */
  pulseScale: number;
  /** Length of one pulse. */
  pulseMs: number;
}

/**
 * Look of a symbol while wins are shown. `HighlightSystem` animates it, `ReelGridView` draws it.
 * A symbol without the component looks as usual.
 */
export interface HighlightData {
  /** True for a symbol of the win on screen, false for a dimmed one. */
  winning: boolean;
  /** Time since the symbol started to pulse. */
  elapsedMs: number;
  /** 1 is the usual color, lower is darker. */
  brightness: number;
  /** 1 is the usual size. */
  scale: number;
}

/** Component on a symbol entity while a win is on screen. `HighlightSystem` adds and removes it. */
export const Highlight = defineComponent<HighlightData>('Highlight');

/**
 * Lights the symbols of a win and dims the others. It does not know why the cells won:
 * the round script says which cells to light, this system only changes how they look.
 */
export class HighlightSystem implements System {
  constructor(
    private readonly world: World,
    private readonly grid: ReelGrid<string>,
    private readonly style: HighlightStyle,
  ) {}

  /**
   * Lights `cells` and dims every other cell of the field. Called again for the next win,
   * a symbol keeps its current brightness and fades to its new state from there.
   */
  show(cells: readonly CellPosition[]): void {
    const winning = new Set(cells.map(cellKey));
    for (const cell of this.grid.visibleCells) {
      const symbol = this.grid.symbolEntity(cell);
      const current = this.world.get(symbol, Highlight);
      this.world.add(symbol, Highlight, {
        winning: winning.has(cellKey(cell)),
        elapsedMs: 0,
        brightness: current?.brightness ?? 1,
        scale: current?.scale ?? 1,
      });
    }
  }

  /** Returns every symbol to its usual look at once. */
  clear(): void {
    for (const symbol of this.world.query(Highlight)) {
      this.world.remove(symbol, Highlight);
    }
  }

  update(deltaMs: number): void {
    for (const symbol of this.world.query(Highlight)) {
      const highlight = this.world.get(symbol, Highlight);
      if (highlight) {
        advanceHighlight(highlight, deltaMs, this.style);
      }
    }
  }
}

/** Moves the look one frame on: brightness towards its target, the pulse of a winning symbol. */
export function advanceHighlight(
  highlight: HighlightData,
  deltaMs: number,
  style: HighlightStyle,
): void {
  const target = highlight.winning ? 1 : style.dimBrightness;
  const fadeStep = style.fadeMs > 0 ? ((1 - style.dimBrightness) * deltaMs) / style.fadeMs : 1;
  highlight.brightness = moveTowards(highlight.brightness, target, fadeStep);
  if (!highlight.winning) {
    highlight.scale = 1;
    return;
  }
  highlight.elapsedMs += deltaMs;
  // 0 at the start of a pulse, 1 at its middle, back to 0 at its end: a smooth breath.
  const phase = (highlight.elapsedMs % style.pulseMs) / style.pulseMs;
  highlight.scale = 1 + style.pulseScale * (0.5 - 0.5 * Math.cos(phase * 2 * Math.PI));
}

function moveTowards(value: number, target: number, maxStep: number): number {
  if (Math.abs(target - value) <= maxStep) {
    return target;
  }
  return value + Math.sign(target - value) * maxStep;
}

function cellKey(cell: CellPosition): string {
  return `${String(cell.reelIndex)}:${String(cell.rowIndex)}`;
}
