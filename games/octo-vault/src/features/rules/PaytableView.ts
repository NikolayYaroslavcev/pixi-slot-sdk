import { Container, Graphics, Sprite, Text, type Texture } from 'pixi.js';
import { formatMoney } from 'slot-sdk';
import { freeSpinsConfig, tentacleGrabConfig } from '../../config/features.config';
import { paytable, type MatchCount } from '../../config/paytable';
import { rulesConfig } from '../../config/rules.config';

const counts: readonly MatchCount[] = [5, 4, 3];

/**
 * The body of the Rules popup: each paying symbol with what 5, 4 and 3 of it win at the
 * current bet, then the Wild and the Scatter with what they do. Centered on x = 0, growing
 * down from y = 0, as the popup expects. Built anew for every opening, so amounts follow the bet.
 */
export function createPaytable(bet: number, symbolTexture: (id: string) => Texture): Container {
  const view = new Container({ label: 'paytable' });
  const { columns, cellWidth, symbolSize, rowGap } = rulesConfig;
  const rowHeight = symbolSize + rulesConfig.payFontSize * 3.6 + rowGap;
  rulesConfig.order.forEach((symbolId, index) => {
    const cell = payCell(symbolTexture(symbolId), paytable[symbolId], bet);
    cell.x = ((index % columns) - (columns - 1) / 2) * cellWidth;
    cell.y = Math.floor(index / columns) * rowHeight;
    view.addChild(cell);
  });
  let y = Math.ceil(rulesConfig.order.length / columns) * rowHeight;
  const gridWidth = (columns - 1) * cellWidth + symbolSize;
  const line = divider(gridWidth);
  line.y = y + rowGap * 0.5;
  view.addChild(line);
  y += rowGap * 2;
  for (const special of rulesConfig.specials) {
    const row = specialRow(symbolTexture(special.symbol), special.name, fillIn(special.text));
    row.x = -gridWidth / 2;
    row.y = y;
    view.addChild(row);
    y += Math.max(symbolSize, row.height) + rowGap;
  }
  return view;
}

function payCell(texture: Texture, pays: Readonly<Record<MatchCount, number>>, bet: number) {
  const { symbolSize, payFontSize } = rulesConfig;
  const cell = new Container();
  cell.addChild(
    new Sprite({ texture, anchor: { x: 0.5, y: 0 }, width: symbolSize, height: symbolSize }),
  );
  // Counts right-aligned, amounts left-aligned on one axis; the whole table then centered
  // under the symbol by its real width, so long and short amounts both sit in the middle.
  const table = new Container({ y: symbolSize + 8 });
  counts.forEach((count, index) => {
    const y = index * payFontSize * 1.2;
    const countText = text(`${String(count)}×`, payFontSize, rulesConfig.countColor);
    const amountText = text(
      formatMoney(Math.round(pays[count] * bet)),
      payFontSize,
      rulesConfig.amountColor,
    );
    countText.anchor.set(1, 0);
    countText.position.set(0, y);
    amountText.position.set(payFontSize * 0.3, y);
    table.addChild(countText, amountText);
  });
  const bounds = table.getLocalBounds();
  table.x = -(bounds.x + bounds.width / 2);
  cell.addChild(table);
  return cell;
}

/** A special symbol at the left edge of the grid, its name in gold and what it does below. */
function specialRow(texture: Texture, name: string, description: string): Container {
  const { symbolSize, cellWidth, columns, specialFontSize, specialNameFontSize } = rulesConfig;
  const width = (columns - 1) * cellWidth + symbolSize;
  const textX = symbolSize + 28;
  const row = new Container();
  const sprite = new Sprite({ texture, width: symbolSize, height: symbolSize });
  const title = text(name, specialNameFontSize, rulesConfig.countColor);
  const label = text(description, specialFontSize, rulesConfig.textColor);
  label.style.wordWrap = true;
  label.style.wordWrapWidth = width - textX;
  label.style.lineHeight = specialFontSize * 1.25;
  // Name and description as one block, centered on the symbol beside them.
  const blockHeight = title.height + 2 + label.height;
  title.position.set(textX, (symbolSize - blockHeight) / 2);
  label.position.set(textX, title.y + title.height + 2);
  row.addChild(sprite, title, label);
  return row;
}

/** A thin gold rule with a diamond in the middle, between the pays and the special symbols. */
function divider(width: number): Graphics {
  const color = rulesConfig.dividerColor;
  return new Graphics()
    .moveTo(-width / 2, 0)
    .lineTo(-14, 0)
    .moveTo(14, 0)
    .lineTo(width / 2, 0)
    .stroke({ width: 3, color, alpha: 0.7 })
    .poly([0, -9, 9, 0, 0, 9, -9, 0])
    .fill(color);
}

function text(value: string, fontSize: number, fill: string): Text {
  return new Text({ text: value, style: { fontFamily: 'Lilita One', fontSize, fill } });
}

/** Puts the numbers of the feature configs into a description, so the rules never disagree with them. */
function fillIn(description: string): string {
  const scatters = freeSpinsConfig.spinsByScatters;
  return description
    .replace(
      '{multipliers}',
      orList(tentacleGrabConfig.multipliers.map(({ value }) => `×${String(value)}`)),
    )
    .replace('{scatters}', orList(scatters.map(({ scatters: count }) => String(count))))
    .replace('{spins}', orList(scatters.map(({ spins }) => String(spins))));
}

function orList(items: readonly string[]): string {
  return items.length < 2
    ? items.join('')
    : `${items.slice(0, -1).join(', ')} or ${items.at(-1) ?? ''}`;
}
