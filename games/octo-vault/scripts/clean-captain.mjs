// Cleans the v3 layers of the octopus captain (art/pirate-octopus-animation/*.png) into
// public/assets/captain/. The layers were cut out of a sheet, and the cut left sheet frames,
// file-name captions, slivers of neighbouring art and dark halos. This removes them and crops
// each layer to its art. Deterministic: `node scripts/clean-captain.mjs`.
import { Buffer } from 'node:buffer';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { decodePng, encodePng } from './lib/png.mjs';

const game = join(dirname(fileURLToPath(import.meta.url)), '..');
const assets = join(game, 'public/assets');
// The sources live outside public/, so the build does not ship them.
const source = join(game, 'art/pirate-octopus-animation');
const target = join(assets, 'captain');

/**
 * The layers the game uses and how to clean them. `minShare`: a separate piece of art is kept
 * only if it is at least this share of the largest one (low for scattered effects).
 * `background`: the layer sits on a dark square, whose pixels darker than this (sum of RGB) are
 * removed from the edges inward. `captionFrom`: the file-name caption starts at this row.
 * `clearLeft`: this many columns on the left hold a sliver of the neighbouring art.
 * `from` and `keep`: a layer cut out of another one, the rectangle `[left, top, right, bottom]`
 * of the source, faded to nothing toward its edges so it lies on the skin without a seam.
 * `felt`: dark cloth lost to the background removal left holes inside the gold trim; they are
 * filled with this vertical gradient `[top, bottom]` until the layer is exported again.
 * `feltHull`: the outline is open too, so the cloth fills the convex hull of the gold trim
 * below `fromRow` instead (above it the feather has gold glints of its own).
 * `keepTop`: the top is the art's own edge (the shoulders), never softened as a sheet cut.
 * `neckline`: a half-ellipse cut into the top of the coat, `halfWidth` × `depth` around
 * column `x`, so the coat opens under the chin instead of ending in a straight line.
 * `trimDarkSides`: dark pixels this close to the left and right edges are leftovers of the sheet
 * frame. `fadeBottom`: the bottom rows fade out, so the hat sinks onto the head.
 * `dropRed`: red pixels are cleared (the torn scarf of the collar; the red skin behind shows instead).
 * `defringe`: grey-black fringe of the sheet background is peeled off the outline of red skin;
 * the skin's own outline is dark red, so it stays.
 * `lightOnly`: a glow drawn additively keeps only its light; its dark smoke turns clear.
 * Every layer then has its straight sheet cuts faded out and its outline smoothed.
 */
const layers = {
  body: { defringe: true },
  tentacle_1: { defringe: true },
  tentacle_2: { defringe: true },
  tentacle_3: { defringe: true },
  tentacle_4: { clearLeft: 26, defringe: true },
  tentacle_5: { defringe: true },
  tentacle_6: { defringe: true },
  tentacle_7: { defringe: true },
  tentacle_8: { defringe: true },
  eyes_angry: { minShare: 0.2 },
  // eyes_closed.png holds one whole closed eye (the left); the game mirrors it for the right one.
  eye_closed: { from: 'eyes_closed', keep: [3, 50, 62, 118] },
  mouth_grin: {
    felt: [
      [70, 10, 14],
      [95, 18, 22],
    ],
  },
  hat: {
    felt: [
      [52, 38, 50],
      [16, 10, 16],
    ],
    feltHull: { fromRow: 45 },
    fadeBottom: 10,
  },
  coat: {
    minShare: 0.02,
    felt: [
      [40, 30, 42],
      [14, 10, 14],
    ],
    neckline: { x: 127, halfWidth: 62, depth: 42 },
    keepTop: true,
    trimDarkSides: 12,
  },
  // The collar the coat lost to the sheet cut: two gold-trimmed lapels, worn over the coat's top.
  // Only the lapels are kept: the torn scarf between them goes, the red body shows there.
  coat_collar: {
    minShare: 0.1,
    felt: [
      [40, 30, 42],
      [14, 10, 14],
    ],
    neckline: { x: 72, halfWidth: 52, depth: 34 },
    dropRed: true,
  },
  compass: {},
  glow_gold: { minShare: 0.002, captionFrom: 150, lightOnly: true },
  sparkles: { minShare: 0.002, captionFrom: 140, lightOnly: true },
  coins: { minShare: 0.01, background: 110 },
  coin_trail: { minShare: 0.01, captionFrom: 150, lightOnly: true },
  chest: { background: 110 },
};

/** Thin lines (frames, caption strokes) vanish when the art is shrunk and grown back by this. */
const OPEN_RADIUS = 2;
/** Detail of the art within this distance of its solid body is kept, e.g. sparkle rays. */
const DETAIL_RADIUS = 3;

function clean(image, options) {
  if (options.keep) {
    return crop(fadeOutside(image, options.keep), 0);
  }
  clearSheetLeftovers(image, options);
  keepArt(image, options.minShare ?? 0.05);
  if (options.felt) {
    const { felt, feltHull } = options;
    fillHoles(image, felt, feltHull ? hullMask(image, feltHull.fromRow) : null);
  }
  shape(image, options);
  return smoothEdges(softenCuts(crop(image, 2), options));
}

/** The touches particular to some layers: the coat's neck and sides, the hat's brim, glows. */
function shape(image, options) {
  if (options.trimDarkSides) {
    trimDarkSides(image, options.trimDarkSides);
  }
  if (options.neckline) {
    cutNeckline(image, options.neckline);
  }
  if (options.fadeBottom) {
    fadeBottom(image, options.fadeBottom);
  }
  if (options.lightOnly) {
    keepLight(image);
  }
  if (options.dropRed) {
    dropRed(image);
  }
  if (options.defringe) {
    peelFringe(image);
  }
}

/**
 * Anti-aliases the outline: alpha is capped by its 3 × 3 average, so the stair-steps the
 * background removal left along the edge turn into a soft half-pixel rim.
 */
function smoothEdges(image) {
  const { width, height, data } = image;
  const alpha = Uint8Array.from({ length: width * height }, (_, i) => data[i * 4 + 3]);
  for (let i = 0; i < width * height; i++) {
    const x = i % width;
    const y = (i / width) | 0;
    let sum = 0;
    for (const n of neighbours(x, y, width, height)) sum += alpha[n];
    // Pixels outside the image count as clear.
    const mean = (sum + alpha[i]) / 9;
    data[i * 4 + 3] = Math.min(alpha[i], Math.round(mean));
  }
  return image;
}

/** A run of solid pixels this long along a side of the cropped art is a straight cut of the sheet. */
const CUT_RUN = 14;
/** A cut side fades out over this many pixels, so no straight edge shows on screen. */
const CUT_FADE = 16;

/**
 * Fades out the sides of the art cut straight by the sheet: the base of a tentacle, the tip of
 * the feather at the edge of the hat. A natural outline touches its box at a few pixels only.
 */
function softenCuts(image, { keepTop = false } = {}) {
  const { width, height, data } = image;
  const cut = { ...cutSides(image), ...(keepTop ? { top: false } : {}) };
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const distances = [
        cut.left ? x : Infinity,
        cut.right ? width - 1 - x : Infinity,
        cut.top ? y : Infinity,
        cut.bottom ? height - 1 - y : Infinity,
      ];
      const fade = Math.min(1, Math.min(...distances) / CUT_FADE);
      data[(y * width + x) * 4 + 3] *= fade;
    }
  }
  return image;
}

/** Which sides of the art hold a straight run of solid pixels in their outer rows. */
function cutSides({ width, height, data }) {
  const solid = (x, y) => data[(y * width + x) * 4 + 3] > 200;
  const longestRun = (length, at) => {
    let [best, run] = [0, 0];
    for (let k = 0; k < length; k++) {
      run = at(k) ? run + 1 : 0;
      best = Math.max(best, run);
    }
    return best;
  };
  const side = (length, at) =>
    [0, 1, 2, 3].some((d) => longestRun(length, (k) => at(k, d)) >= CUT_RUN);
  return {
    left: side(height, (k, d) => solid(d, k)),
    right: side(height, (k, d) => solid(width - 1 - d, k)),
    top: side(width, (k, d) => solid(k, d)),
    bottom: side(width, (k, d) => solid(k, height - 1 - d)),
  };
}

/** Clears the caption, the sliver of the neighbour and a dark background square. */
function clearSheetLeftovers(image, { captionFrom = Infinity, clearLeft = 0, background = 0 }) {
  const { width, height, data } = image;
  data.fill(0, Math.min(captionFrom, height) * width * 4);
  for (let y = 0; y < height; y++) {
    data.fill(0, y * width * 4, (y * width + clearLeft) * 4);
  }
  if (background > 0) {
    clearDarkFromEdges(image, background);
  }
}

/** Keeps the pieces of art and their fine detail; drops thin lines, slivers and dark halos. */
function keepArt({ width, height, data }, minShare) {
  const visible = mask(width, height, (i) => data[i * 4 + 3] > 60);
  const solid = dilate(erode(visible, width, height, OPEN_RADIUS), width, height, OPEN_RADIUS);
  const near = dilate(keepPieces(solid, width, height, minShare), width, height, DETAIL_RADIUS);
  for (let i = 0; i < width * height; i++) {
    const p = i * 4;
    const luminance = (data[p] * 0.3 + data[p + 1] * 0.59 + data[p + 2] * 0.11) | 0;
    // A dark, half-transparent pixel at the edge is the halo of the old background.
    const halo = data[p + 3] < 230 && luminance < 35;
    if (!near[i] || halo) {
      data[p + 3] = 0;
    }
  }
}

/** Clears the red pixels. */
function dropRed({ width, height, data }) {
  for (let i = 0; i < width * height; i++) {
    const [r, g, b] = [data[i * 4], data[i * 4 + 1], data[i * 4 + 2]];
    if (r > 70 && r > 2 * g && r > 1.6 * b) {
      data[i * 4 + 3] = 0;
    }
  }
  // Specks of its shadow are left floating; they go with it.
  const kept = keepPieces(
    mask(width, height, (i) => data[i * 4 + 3] > 30),
    width,
    height,
    0.02,
  );
  for (let i = 0; i < width * height; i++) {
    if (!kept[i]) data[i * 4 + 3] = 0;
  }
}

/** The fringe is peeled this many pixels deep at most. */
const FRINGE_DEPTH = 4;

/**
 * Clears the dark grey pixels at the outline, layer by layer from the clear outside inward:
 * left from the dark sheet background, unlike the skin's dark red outline. Then thins that
 * outline by its outer pixel.
 */
function peelFringe({ width, height, data }) {
  const fringe = (i) => {
    const [r, g, b] = [data[i * 4], data[i * 4 + 1], data[i * 4 + 2]];
    return Math.max(r, g, b) < 110 && r - Math.max(g, b) < 30;
  };
  for (let pass = 0; pass < FRINGE_DEPTH; pass++) {
    peelEdge({ width, height, data }, fringe);
  }
  // The outline itself is drawn 2–3 pixels thick and ragged; its outer pixel goes too.
  peelEdge({ width, height, data }, (i) => Math.max(data[i * 4], data[i * 4 + 1]) < 80);
}

/** Clears the visible pixels next to clear ones that pass `test`. */
function peelEdge({ width, height, data }, test) {
  const clear = mask(width, height, (i) => data[i * 4 + 3] < 30);
  const edge = dilate(clear, width, height, 1);
  for (let i = 0; i < width * height; i++) {
    if (edge[i] && !clear[i] && test(i)) {
      data[i * 4 + 3] = 0;
    }
  }
}

/** Alpha follows brightness, so dark smoke around a glow vanishes instead of browning the scene. */
function keepLight({ width, height, data }) {
  for (let i = 0; i < width * height; i++) {
    const p = i * 4;
    const brightness = Math.max(data[p], data[p + 1], data[p + 2]) / 255;
    data[p + 3] *= Math.max(0, (brightness - 0.35) / 0.65) ** 1.5;
  }
}

/** Clears dark pixels within `columns` of the left and right edges. */
function trimDarkSides({ width, height, data }, columns) {
  for (let i = 0; i < width * height; i++) {
    const x = i % width;
    const p = i * 4;
    const nearSide = x < columns || x >= width - columns;
    if (nearSide && data[p] + data[p + 1] + data[p + 2] < 150) {
      data[p + 3] = 0;
    }
  }
}

/** Fades out a half-ellipse hanging from the top edge: the open neck of the coat. */
function cutNeckline({ width, height, data }, { x: cx, halfWidth, depth }) {
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const reach = Math.hypot((x - cx) / halfWidth, y / depth);
      // Clear inside, opaque from 1.08 of the radius out: a crisp rim that is still not aliased.
      const keep = Math.min(1, Math.max(0, (reach - 1) / 0.08));
      data[(y * width + x) * 4 + 3] *= keep;
    }
  }
}

/** Fades the bottom `rows` rows of the art out, measured from its lowest visible pixel. */
function fadeBottom({ width, height, data }, rows) {
  let bottom = 0;
  for (let i = 0; i < width * height; i++) {
    if (data[i * 4 + 3] > 200) bottom = (i / width) | 0;
  }
  for (let y = bottom - rows; y < height; y++) {
    const keep = Math.max(0, (bottom - y) / rows);
    for (let x = 0; x < width; x++) {
      data[(y * width + x) * 4 + 3] *= keep;
    }
  }
}

/** Gaps in the outline up to this wide still count as closed when looking for holes. */
const HOLE_GAP = 4;

/**
 * Fills the holes of the art (clear pixels the outside cannot reach) with a vertical gradient
 * of cloth, under whatever half-clear art is there.
 */
function fillHoles({ width, height, data }, [top, bottom], inside) {
  const opaque = mask(width, height, (i) => data[i * 4 + 3] > 40);
  const walls = dilate(opaque, width, height, HOLE_GAP);
  const outside = inside
    ? mask(width, height, (i) => !inside[i])
    : dilate(reachFromEdges(walls, width, height), width, height, HOLE_GAP + 1);
  for (let i = 0; i < width * height; i++) {
    if (opaque[i] || outside[i]) {
      continue;
    }
    const share = ((i / width) | 0) / height;
    const p = i * 4;
    const alpha = data[p + 3] / 255;
    for (let c = 0; c < 3; c++) {
      const cloth = top[c] + (bottom[c] - top[c]) * share;
      data[p + c] = data[p + c] * alpha + cloth * (1 - alpha);
    }
    data[p + 3] = 255;
  }
}

/** Pixels inside the convex hull of the gold pixels from row `fromRow` down. */
function hullMask({ width, height, data }, fromRow) {
  const points = [];
  for (let i = fromRow * width; i < width * height; i++) {
    const p = i * 4;
    // The gold trim and badge outline the hat; the feather and stray dark pixels do not count.
    const gold = data[p] > 150 && data[p + 1] > 100 && data[p + 2] < 110;
    if (data[p + 3] > 150 && gold) {
      points.push([i % width, (i / width) | 0]);
    }
  }
  const hull = convexHull(points);
  return mask(width, height, (i) => insideConvex(hull, i % width, (i / width) | 0));
}

/** Monotone chain: the hull of `points`, counter-clockwise in image coordinates. */
function convexHull(points) {
  const sorted = [...points].sort(([ax, ay], [bx, by]) => ax - bx || ay - by);
  const cross = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const half = (list) => {
    const chain = [];
    for (const point of list) {
      while (
        chain.length >= 2 &&
        cross(chain[chain.length - 2], chain[chain.length - 1], point) <= 0
      ) {
        chain.pop();
      }
      chain.push(point);
    }
    chain.pop();
    return chain;
  };
  return [...half(sorted), ...half([...sorted].reverse())];
}

function insideConvex(hull, x, y) {
  return hull.every((a, index) => {
    const b = hull[(index + 1) % hull.length];
    return (b[0] - a[0]) * (y - a[1]) - (b[1] - a[1]) * (x - a[0]) >= 0;
  });
}

/** Pixels reachable from the image edges without crossing `walls`. */
function reachFromEdges(walls, width, height) {
  const reached = new Uint8Array(width * height);
  const stack = [];
  for (let x = 0; x < width; x++) stack.push(x, (height - 1) * width + x);
  for (let y = 0; y < height; y++) stack.push(y * width, y * width + width - 1);
  while (stack.length > 0) {
    const i = stack.pop();
    if (reached[i] || walls[i]) {
      continue;
    }
    reached[i] = 1;
    const x = i % width;
    if (x > 0) stack.push(i - 1);
    if (x < width - 1) stack.push(i + 1);
    if (i >= width) stack.push(i - width);
    if (i < width * (height - 1)) stack.push(i + width);
  }
  return reached;
}

/** Keeps the ellipse inscribed in `keep`, its alpha falling off smoothly toward the rim. */
function fadeOutside({ width, height, data }, [left, top, right, bottom]) {
  const [cx, cy] = [(left + right) / 2, (top + bottom) / 2];
  const [rx, ry] = [(right - left) / 2, (bottom - top) / 2];
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const distance = Math.hypot((x - cx) / rx, (y - cy) / ry);
      const fade = Math.min(1, Math.max(0, (1 - distance) / 0.35));
      data[(y * width + x) * 4 + 3] *= fade;
    }
  }
  return { width, height, data };
}

const mask = (width, height, test) =>
  Uint8Array.from({ length: width * height }, (_, i) => (test(i) ? 1 : 0));

/** Square min (erode) or max (dilate) filter of `radius`, done per axis. */
function morph(source, width, height, radius, keepIf) {
  const pass = (input, horizontal) =>
    mask(width, height, (i) => {
      const x = i % width;
      const y = (i / width) | 0;
      let count = 0;
      for (let d = -radius; d <= radius; d++) {
        const [nx, ny] = horizontal ? [x + d, y] : [x, y + d];
        const inside = nx >= 0 && ny >= 0 && nx < width && ny < height;
        count += inside ? input[ny * width + nx] : 0;
      }
      return keepIf(count, radius * 2 + 1);
    });
  return pass(pass(source, true), false);
}
const erode = (m, w, h, r) => morph(m, w, h, r, (count, size) => count === size);
const dilate = (m, w, h, r) => morph(m, w, h, r, (count) => count > 0);

/** Keeps the largest piece and those big enough beside it; drops small slivers at the edge. */
function keepPieces(solid, width, height, minShare) {
  const { labels, pieces } = label(solid, width, height);
  const largest = Math.max(0, ...pieces.map((piece) => piece.area));
  const keep = new Set(
    pieces
      .filter(
        ({ area, touchesEdge }) =>
          area >= largest * minShare && !(touchesEdge && area < largest * 0.25),
      )
      .map(({ id }) => id),
  );
  return mask(width, height, (i) => keep.has(labels[i]));
}

/** Connected pieces of a mask (8 neighbours), with their size and whether they touch the edge. */
function label(m, width, height) {
  const labels = new Int32Array(width * height);
  const pieces = [];
  for (let start = 0; start < m.length; start++) {
    if (m[start] && !labels[start]) {
      pieces.push(fillPiece(m, labels, width, height, start, pieces.length + 1));
    }
  }
  return { labels, pieces };
}

function fillPiece(m, labels, width, height, start, id) {
  const piece = { id, area: 0, touchesEdge: false };
  const stack = [start];
  labels[start] = id;
  while (stack.length > 0) {
    const i = stack.pop();
    const x = i % width;
    const y = (i / width) | 0;
    piece.area += 1;
    piece.touchesEdge ||= x === 0 || y === 0 || x === width - 1 || y === height - 1;
    for (const n of neighbours(x, y, width, height).filter((n) => m[n] && !labels[n])) {
      labels[n] = id;
      stack.push(n);
    }
  }
  return piece;
}

const AROUND = [
  [-1, -1],
  [0, -1],
  [1, -1],
  [-1, 0],
  [1, 0],
  [-1, 1],
  [0, 1],
  [1, 1],
];

/** Indexes of the up to 8 pixels around `x, y`. */
function neighbours(x, y, width, height) {
  return AROUND.map(([dx, dy]) => [x + dx, y + dy])
    .filter(([nx, ny]) => nx >= 0 && ny >= 0 && nx < width && ny < height)
    .map(([nx, ny]) => ny * width + nx);
}

/** Clears pixels darker than `limit` that are reachable from the edges through such pixels. */
function clearDarkFromEdges({ width, height, data }, limit) {
  const dark = (i) =>
    data[i * 4] + data[i * 4 + 1] + data[i * 4 + 2] < limit || data[i * 4 + 3] < 20;
  const seen = new Uint8Array(width * height);
  const stack = [];
  for (let x = 0; x < width; x++) {
    stack.push(x, (height - 1) * width + x);
  }
  for (let y = 0; y < height; y++) {
    stack.push(y * width, y * width + width - 1);
  }
  while (stack.length > 0) {
    const i = stack.pop();
    if (seen[i] || !dark(i)) {
      continue;
    }
    seen[i] = 1;
    data[i * 4 + 3] = 0;
    const x = i % width;
    if (x > 0) stack.push(i - 1);
    if (x < width - 1) stack.push(i + 1);
    if (i >= width) stack.push(i - width);
    if (i < width * (height - 1)) stack.push(i + width);
  }
}

/** Cuts the image to its visible pixels with `padding` around. */
function crop({ width, height, data }, padding) {
  let [x0, y0, x1, y1] = [width, height, -1, -1];
  for (let i = 0; i < width * height; i++) {
    if (data[i * 4 + 3] > 0) {
      const x = i % width;
      const y = (i / width) | 0;
      [x0, y0, x1, y1] = [Math.min(x0, x), Math.min(y0, y), Math.max(x1, x), Math.max(y1, y)];
    }
  }
  const left = Math.max(0, x0 - padding);
  const top = Math.max(0, y0 - padding);
  const w = Math.min(width, x1 + padding + 1) - left;
  const h = Math.min(height, y1 + padding + 1) - top;
  const out = Buffer.alloc(w * h * 4);
  for (let y = 0; y < h; y++) {
    data.copy(out, y * w * 4, ((top + y) * width + left) * 4, ((top + y) * width + left + w) * 4);
  }
  return { width: w, height: h, data: out, left, top };
}

mkdirSync(target, { recursive: true });
for (const [name, options] of Object.entries(layers)) {
  const file = join(source, `${options.from ?? name}.png`);
  const cleaned = clean(decodePng(readFileSync(file)), options);
  writeFileSync(join(target, `${name}.png`), encodePng(cleaned));
  console.info(
    `${name}: ${String(cleaned.width)} × ${String(cleaned.height)} from (${String(cleaned.left)}, ${String(cleaned.top)})`,
  );
}
