import { Container, Text, type ColorSource } from 'pixi.js';
import { Held, Highlight, type CellPosition, type System, type World } from 'slot-sdk';
import { Multiplier } from './Multiplier';
import type { FieldParts } from './reels';

/** Look of the "×3" badge in the corner of a Wild. Sizes are design pixels of the field. */
export interface MultiplierBadgeStyle {
  fontFamily: string;
  fontSize: number;
  color: ColorSource;
  outlineColor: ColorSource;
  /** From the center of the cell to the center of the badge. */
  offset: { x: number; y: number };
}

interface Badge {
  readonly cell: CellPosition;
  readonly text: Text;
  /** The value on screen, 0 while hidden. */
  shown: number;
}

/**
 * Draws the `Multiplier` of every cell as a badge on the field. One text per cell is created
 * once and only changes when its value does. Badges hide while the reels spin: the symbols
 * they belong to are leaving the field. A held symbol stays, and so does its badge. A badge dims with its symbol while wins are shown.
 */
export class MultiplierBadges implements System {
  private readonly container = new Container({ label: 'multipliers' });
  private readonly badges: Badge[];

  constructor(
    private readonly world: World,
    private readonly field: FieldParts,
    style: MultiplierBadgeStyle,
  ) {
    this.badges = field.grid.visibleCells.map((cell) => {
      const center = field.view.cellCenter(cell);
      const text = new Text({
        anchor: 0.5,
        x: center.x + style.offset.x,
        y: center.y + style.offset.y,
        visible: false,
        style: {
          fontFamily: style.fontFamily,
          fontSize: style.fontSize,
          fill: style.color,
          stroke: { color: style.outlineColor, width: style.fontSize / 6, join: 'round' },
        },
      });
      this.container.addChild(text);
      return { cell, text, shown: 0 };
    });
    field.view.container.addChild(this.container);
  }

  update(): void {
    const spinning = this.field.spinner.isSpinning;
    for (const badge of this.badges) {
      const symbol = this.field.grid.symbolEntity(badge.cell);
      const leaving = spinning && !this.world.has(symbol, Held);
      this.show(badge, leaving ? 0 : (this.world.get(symbol, Multiplier)?.value ?? 0));
      badge.text.alpha = this.world.get(symbol, Highlight)?.brightness ?? 1;
    }
  }

  private show(badge: Badge, value: number): void {
    if (badge.shown === value) {
      return;
    }
    badge.shown = value;
    badge.text.visible = value > 0;
    badge.text.text = `×${String(value)}`;
  }
}
