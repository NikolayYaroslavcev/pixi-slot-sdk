// Turns lettering into SVG paths with the outlines of a TrueType font, so the art scripts can
// write titles and symbol letters in the game's font without embedding the font in every file:
// an SVG drawn as an image cannot reach the page's fonts. Reads only what outlines need:
// `head`, `hhea`, `hmtx`, `cmap` (format 4), `loca` and `glyf`. No kerning.
import { readFileSync } from 'node:fs';

const onCurve = 1;
const xShort = 2;
const yShort = 4;
const repeatFlag = 8;
const xSameOrPositive = 16;
const ySameOrPositive = 32;

export function loadFont(path) {
  const bytes = readFileSync(path);
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const tables = readTables(view);
  const head = tables.get('head');
  const hhea = tables.get('hhea');
  const font = {
    view,
    tables,
    unitsPerEm: view.getUint16(head + 18),
    longLoca: view.getInt16(head + 50) === 1,
    metricCount: view.getUint16(hhea + 34),
    cmap: findUnicodeMap(view, tables.get('cmap')),
  };
  return font;
}

function readTables(view) {
  const tables = new Map();
  const count = view.getUint16(4);
  for (let index = 0; index < count; index += 1) {
    const record = 12 + index * 16;
    const tag = String.fromCharCode(
      ...[0, 1, 2, 3].map((offset) => view.getUint8(record + offset)),
    );
    tables.set(tag, view.getUint32(record + 8));
  }
  return tables;
}

/** Offset of the Windows Unicode (3, 1) subtable of `cmap`. */
function findUnicodeMap(view, cmap) {
  const count = view.getUint16(cmap + 2);
  for (let index = 0; index < count; index += 1) {
    const record = cmap + 4 + index * 8;
    if (view.getUint16(record) === 3 && view.getUint16(record + 2) === 1) {
      return cmap + view.getUint32(record + 4);
    }
  }
  throw new Error('glyphs: the font has no Unicode cmap');
}

/** Glyph index of a character, from a format 4 subtable. 0 is the missing glyph. */
function glyphIndex(font, char) {
  const { view, cmap } = font;
  const code = char.codePointAt(0) ?? 0;
  const segments = view.getUint16(cmap + 6) / 2;
  const ends = cmap + 14;
  const starts = ends + segments * 2 + 2;
  const deltas = starts + segments * 2;
  const rangeOffsets = deltas + segments * 2;
  for (let segment = 0; segment < segments; segment += 1) {
    if (view.getUint16(ends + segment * 2) < code) {
      continue;
    }
    const start = view.getUint16(starts + segment * 2);
    const delta = view.getUint16(deltas + segment * 2);
    const rangeOffset = view.getUint16(rangeOffsets + segment * 2);
    return code < start
      ? 0
      : mapInSegment(view, { code, start, delta, rangeOffset, segment, rangeOffsets });
  }
  return 0;
}

function mapInSegment(view, { code, start, delta, rangeOffset, segment, rangeOffsets }) {
  if (rangeOffset === 0) {
    return (code + delta) & 0xffff;
  }
  const address = rangeOffsets + segment * 2 + rangeOffset + (code - start) * 2;
  const glyph = view.getUint16(address);
  return glyph === 0 ? 0 : (glyph + delta) & 0xffff;
}

function advanceWidth(font, glyph) {
  const metric = Math.min(glyph, font.metricCount - 1);
  return font.view.getUint16(font.tables.get('hmtx') + metric * 4);
}

/** Start of the glyph's outline in the file, or null for an empty glyph such as a space. */
function glyphOffset(font, glyph) {
  const { view, tables, longLoca } = font;
  const loca = tables.get('loca');
  const at = (index) =>
    longLoca ? view.getUint32(loca + index * 4) : view.getUint16(loca + index * 2) * 2;
  const start = at(glyph);
  return start === at(glyph + 1) ? null : tables.get('glyf') + start;
}

/** Contours of a glyph in font units: arrays of `{ x, y, on }`. */
function glyphContours(font, glyph) {
  const offset = glyphOffset(font, glyph);
  if (offset === null) {
    return [];
  }
  const contourCount = font.view.getInt16(offset);
  return contourCount >= 0
    ? simpleContours(font.view, offset, contourCount)
    : compositeContours(font, offset);
}

function simpleContours(view, offset, contourCount) {
  const ends = Array.from({ length: contourCount }, (_, index) =>
    view.getUint16(offset + 10 + index * 2),
  );
  const pointCount = (ends.at(-1) ?? -1) + 1;
  let cursor = offset + 10 + contourCount * 2;
  cursor += 2 + view.getUint16(cursor);
  const flags = [];
  while (flags.length < pointCount) {
    const flag = view.getUint8(cursor++);
    const repeats = flag & repeatFlag ? view.getUint8(cursor++) : 0;
    flags.push(...Array.from({ length: repeats + 1 }, () => flag));
  }
  const xs = readCoordinates(view, cursor, flags, xShort, xSameOrPositive);
  const ys = readCoordinates(view, xs.end, flags, yShort, ySameOrPositive);
  const points = flags.map((flag, index) => ({
    x: xs.values[index],
    y: ys.values[index],
    on: (flag & onCurve) !== 0,
  }));
  return ends.map((end, index) =>
    points.slice(index === 0 ? 0 : (ends[index - 1] ?? 0) + 1, end + 1),
  );
}

/** Delta-encoded coordinates of one axis. */
function readCoordinates(view, start, flags, shortBit, sameBit) {
  let cursor = start;
  let value = 0;
  const values = flags.map((flag) => {
    if (flag & shortBit) {
      const delta = view.getUint8(cursor++);
      value += flag & sameBit ? delta : -delta;
    } else if (!(flag & sameBit)) {
      value += view.getInt16(cursor);
      cursor += 2;
    }
    return value;
  });
  return { values, end: cursor };
}

/** A glyph built from other glyphs, each moved and possibly scaled. */
function compositeContours(font, offset) {
  const { view } = font;
  const contours = [];
  let cursor = offset + 10;
  let more = true;
  while (more) {
    const flags = view.getUint16(cursor);
    const component = view.getUint16(cursor + 2);
    const placement = readPlacement(view, cursor + 4, flags);
    cursor = placement.end;
    contours.push(
      ...glyphContours(font, component).map((points) =>
        points.map((point) => placed(point, placement)),
      ),
    );
    more = (flags & 0x20) !== 0;
  }
  return contours;
}

function readPlacement(view, start, flags) {
  const words = (flags & 1) !== 0;
  const dx = words ? view.getInt16(start) : view.getInt8(start);
  const dy = words ? view.getInt16(start + 2) : view.getInt8(start + 1);
  let cursor = start + (words ? 4 : 2);
  const f2dot14 = () => {
    const value = view.getInt16(cursor) / 16384;
    cursor += 2;
    return value;
  };
  let scale = { xx: 1, xy: 0, yx: 0, yy: 1 };
  if (flags & 0x08) {
    const both = f2dot14();
    scale = { xx: both, xy: 0, yx: 0, yy: both };
  } else if (flags & 0x40) {
    scale = { xx: f2dot14(), xy: 0, yx: 0, yy: f2dot14() };
  } else if (flags & 0x80) {
    scale = { xx: f2dot14(), xy: f2dot14(), yx: f2dot14(), yy: f2dot14() };
  }
  return { dx, dy, ...scale, end: cursor };
}

function placed(point, { dx, dy, xx, xy, yx, yy }) {
  return { x: point.x * xx + point.y * yx + dx, y: point.x * xy + point.y * yy + dy, on: point.on };
}

/** One contour as SVG path commands; off-curve neighbours imply an on-curve point between them. */
function contourPath(points, toSvg) {
  const count = points.length;
  const midpoint = (a, b) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, on: true });
  const firstOn = points.findIndex((point) => point.on);
  const start = firstOn === -1 ? midpoint(points[0], points[count - 1]) : points[firstOn];
  const from = firstOn === -1 ? 0 : firstOn + 1;
  const commands = [`M${toSvg(start)}`];
  let control = null;
  for (let step = 0; step < count; step += 1) {
    const point = points[(from + step) % count];
    if (point.on) {
      commands.push(control ? `Q${toSvg(control)} ${toSvg(point)}` : `L${toSvg(point)}`);
      control = null;
      continue;
    }
    // Two off-curve points in a row: the curve passes through the point between them.
    if (control) commands.push(`Q${toSvg(control)} ${toSvg(midpoint(control, point))}`);
    control = point;
  }
  commands.push(control ? `Q${toSvg(control)} ${toSvg(start)}Z` : 'Z');
  return commands.join('');
}

/** Width of `text` at `size`, with `tracking` extra units of `size` between letters. */
export function textWidth(font, text, size, tracking = 0) {
  const scale = size / font.unitsPerEm;
  const letters = [...text];
  const advances = letters.reduce(
    (sum, char) => sum + advanceWidth(font, glyphIndex(font, char)),
    0,
  );
  return advances * scale + Math.max(letters.length - 1, 0) * tracking * size;
}

/**
 * Path data of `text` with its baseline at `y`. `align` puts `x` at the start or the middle.
 * `tracking` adds space between letters, in units of `size`.
 */
export function textPath(font, text, { size, x = 0, y = 0, align = 'start', tracking = 0 }) {
  const scale = size / font.unitsPerEm;
  let penX = align === 'middle' ? x - textWidth(font, text, size, tracking) / 2 : x;
  const parts = [];
  for (const char of text) {
    const glyph = glyphIndex(font, char);
    const originX = penX;
    const toSvg = (point) => `${round(originX + point.x * scale)} ${round(y - point.y * scale)}`;
    parts.push(...glyphContours(font, glyph).map((points) => contourPath(points, toSvg)));
    penX += advanceWidth(font, glyph) * scale + tracking * size;
  }
  return parts.join('');
}

function round(value) {
  return Math.round(value * 10) / 10;
}
