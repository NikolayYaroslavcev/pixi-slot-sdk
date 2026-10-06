import { Container, Graphics, Text, type ColorSource, type Ticker } from 'pixi.js';
import { easeOutQuad } from '../anim/easing';
import { tween, type Tween } from '../anim/tween';
import type { GameContext } from '../core/GameContext';
import type { WinField } from '../flow/winSteps';
import { formatMoney } from '../math/money';
import type { Win } from '../math/round';
import type { CellPosition } from '../reels/components';
import type { ReelGridView } from '../reels/ReelGridView';
import { WinCounter, winTextStyle } from '../ui/WinCounter';
import type { HighlightSystem } from './Highlight';
import type { WinStyle } from './WinStyle';

type Point = { x: number; y: number };

/**
 * Shows wins on the reels: lights their symbols through `HighlightSystem` and draws their lines,
 * the counter of all wins and the amount of a single win. It is a child of the field, so the
 * layout moves and scales it together with the symbols on every resize and rotation.
 *
 * ```ts
 * context.wins.useField(new FieldWinView(context, view, highlight));
 * ```
 */
export class FieldWinView implements WinField {
  private readonly container = new Container({ label: 'wins', visible: false });
  private readonly lines = new Graphics();
  /** The amount of a single win on a pill in its line color, so the line never crosses the digits. */
  private readonly amount = new Container();
  private readonly amountPill = new Graphics();
  private readonly amountText: Text;
  private readonly counter: WinCounter;
  private readonly style: WinStyle;
  private readonly ticker: Ticker;
  private readonly fadeMs: number;
  /** Width of the field panel: the amount pill stays inside it. */
  private readonly fieldWidth: number;
  /** Wins of the step on screen: a win keeps its line color when it is shown alone. */
  private wins: readonly Win[] = [];
  private appearing: Tween<Container> | null = null;

  constructor(
    context: Pick<GameContext, 'app' | 'config'>,
    private readonly field: ReelGridView,
    private readonly highlight: HighlightSystem,
  ) {
    const { style, timing } = context.config.wins;
    this.style = style;
    this.ticker = context.app.ticker;
    this.fadeMs = timing.fadeMs;
    const textStyle = { ...style, color: style.textColor };
    this.counter = new WinCounter(this.ticker, { ...textStyle, fontSize: style.counterFontSize });
    this.amountText = new Text({
      anchor: 0.5,
      style: winTextStyle({ ...textStyle, fontSize: style.amountFontSize }),
    });
    const bounds = field.container.getLocalBounds();
    this.fieldWidth = bounds.width;
    this.counter.view.position.set(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
    this.amount.addChild(this.amountPill, this.amountText);
    this.container.addChild(this.lines, this.counter.view, this.amount);
    field.container.addChild(this.container);
  }

  showAll(wins: readonly Win[], amount: number, countUpMs: number): void {
    this.wins = wins;
    this.highlight.show(wins.flatMap((win) => win.cells));
    this.drawLines(wins);
    this.amount.visible = false;
    this.counter.view.visible = true;
    this.counter.countUp(amount, countUpMs);
    this.appear();
  }

  showOne(win: Win): void {
    this.highlight.show(win.cells);
    this.drawLines([win]);
    this.counter.stop();
    this.counter.view.visible = false;
    this.showAmount(win);
    this.appear();
  }

  clear(): void {
    this.appearing?.finish();
    this.appearing = null;
    this.counter.stop();
    this.lines.clear();
    this.container.visible = false;
    this.highlight.clear();
    this.wins = [];
  }

  /** Each line twice: wide and faint for a glow, then narrow and solid. */
  private drawLines(wins: readonly Win[]): void {
    this.lines.clear();
    const { lineWidth } = this.style;
    for (const win of wins) {
      if (!win.path) {
        continue;
      }
      const points = win.path.map((cell) => this.field.cellCenter(cell));
      const color = this.lineColor(win);
      const line = { color, cap: 'round', join: 'round' } as const;
      tracePath(this.lines, points).stroke({ ...line, width: lineWidth * 3, alpha: 0.3 });
      tracePath(this.lines, points).stroke({ ...line, width: lineWidth });
    }
  }

  private lineColor(win: Win): ColorSource {
    const colors = this.style.lineColors;
    const index = Math.max(this.wins.indexOf(win), 0);
    return colors[index % colors.length] ?? this.style.textColor;
  }

  private showAmount(win: Win): void {
    const { amountFontSize, outlineColor, lineWidth } = this.style;
    const money = formatMoney(win.amount);
    this.amountText.text = win.caption ? `${win.caption}  ${money}` : money;
    const height = amountFontSize * 1.3;
    const width = this.amountText.width + amountFontSize;
    this.amountPill
      .clear()
      .roundRect(-width / 2, -height / 2, width, height, height / 2)
      .fill({ color: outlineColor, alpha: 0.9 })
      .stroke({ color: this.lineColor(win), width: lineWidth / 2 });
    const { x, y } = this.amountPosition(win.cells);
    const halfWidth = Math.min(width, this.fieldWidth) / 2;
    this.amount.position.set(Math.min(Math.max(x, halfWidth), this.fieldWidth - halfWidth), y);
    this.amount.visible = true;
  }

  /** Over the last symbol of the win, where the eye ends reading it from the left. */
  private amountPosition(cells: readonly CellPosition[]): Point {
    const last = cells.at(-1);
    return last ? this.field.cellCenter(last) : this.counter.view.position;
  }

  private appear(): void {
    this.appearing?.finish();
    this.container.visible = true;
    this.container.alpha = 0;
    this.appearing = tween(
      this.ticker,
      this.container,
      { alpha: 1 },
      {
        duration: this.fadeMs,
        easing: easeOutQuad,
      },
    );
  }
}

function tracePath(graphics: Graphics, points: readonly Point[]): Graphics {
  const [first, ...rest] = points;
  if (!first) {
    return graphics;
  }
  graphics.moveTo(first.x, first.y);
  for (const point of rest) {
    graphics.lineTo(point.x, point.y);
  }
  return graphics;
}
