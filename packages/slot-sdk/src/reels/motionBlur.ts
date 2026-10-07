import { DOMAdapter, Texture, type ICanvas } from 'pixi.js';

/** Vertical blur of a moving reel, growing with its speed. Speeds are in symbols per second. */
export interface MotionBlurOptions {
  /** Below this speed there is no blur, so a reel near its stop is sharp. */
  fromSpeed: number;
  /** At this speed and above the blur is at full `strength`. */
  fullSpeed: number;
  /** Length of the streak at full speed, in design pixels of a cell. */
  strength: number;
  /** Steps between sharp and full blur. Each step is one more blurred copy of every symbol. */
  levels: number;
}

/** Copies of the symbol along the streak: enough that the streak looks smooth, not stepped. */
const streakCopies = 12;
/** Blurred copies are drawn at this share of the symbol's size: blur hides the lost detail. */
const blurredScale = 0.5;

/** 0 for a sharp symbol, up to `levels` for the strongest blur at this speed. */
export function motionBlurLevel(speed: number, options: MotionBlurOptions): number {
  const { fromSpeed, fullSpeed, levels } = options;
  const amount = Math.min(Math.max((Math.abs(speed) - fromSpeed) / (fullSpeed - fromSpeed), 0), 1);
  return Math.ceil(amount * levels);
}

/**
 * Blurred copies of symbol textures, drawn once on a 2D canvas when the field is built. The reels
 * swap a symbol's texture for a copy by their speed instead of running a blur filter every
 * frame: no filter passes per reel on the GPU, and no screen-sized filter textures for a resize
 * to tear out from under the renderer. Without a 2D canvas, e.g. in tests, a copy is the
 * symbol itself.
 */
export class MotionBlurTextures {
  private readonly copies = new Map<Texture, readonly Texture[]>();

  /** `cellHeight` turns the design-pixel `strength` into pixels of each texture. */
  constructor(
    private readonly options: MotionBlurOptions,
    private readonly cellHeight: number,
  ) {}

  /** Draws the copies of `texture` now, e.g. while the game loads rather than on the first spin. */
  prepare(texture: Texture): void {
    if (this.copies.has(texture)) {
      return;
    }
    const { levels, strength } = this.options;
    const copies = Array.from({ length: levels }, (_, index) => {
      const streak = (strength * (index + 1)) / levels;
      return drawBlurred(texture, (streak / this.cellHeight) * texture.height) ?? texture;
    });
    this.copies.set(texture, copies);
  }

  /** `texture` at blur `level`; level 0 is the texture itself. */
  get(texture: Texture, level: number): Texture {
    if (level <= 0) {
      return texture;
    }
    this.prepare(texture);
    return this.copies.get(texture)?.[level - 1] ?? texture;
  }
}

/**
 * The texture smeared vertically over `streak` of its own pixels: copies along the streak, each
 * drawn with the weight that keeps all of them equal (1, 1/2, 1/3, …).
 */
function drawBlurred(texture: Texture, streak: number): Texture | null {
  const image = texture.source.resource as CanvasImageSource | undefined;
  const { frame } = texture;
  const width = Math.max(Math.round(frame.width * blurredScale), 1);
  const height = Math.max(Math.round(frame.height * blurredScale), 1);
  const canvas: ICanvas = DOMAdapter.get().createCanvas(width, height);
  const context = canvas.getContext('2d');
  if (!context || !image) {
    return null;
  }
  const resolution = texture.source.resolution;
  const source = [frame.x, frame.y, frame.width, frame.height].map((value) => value * resolution);
  const [sourceX = 0, sourceY = 0, sourceWidth = 0, sourceHeight = 0] = source;
  for (let copy = 0; copy < streakCopies; copy += 1) {
    const offset = (copy / (streakCopies - 1) - 0.5) * streak * blurredScale;
    context.globalAlpha = 1 / (copy + 1);
    context.drawImage(image, sourceX, sourceY, sourceWidth, sourceHeight, 0, offset, width, height);
  }
  return Texture.from(canvas);
}
