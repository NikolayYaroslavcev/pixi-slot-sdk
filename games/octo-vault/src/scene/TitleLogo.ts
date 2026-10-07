import { Container, Sprite, Texture, type Ticker } from 'pixi.js';

/** How the logo lives. Times in milliseconds, distances in logo texture pixels. */
export interface TitleLogoLook {
  /** A slow float up and down, as if the plank sways on the deck. */
  bob: { height: number; periodMs: number };
  /** A barely visible swell with the same rhythm, a little out of step with the float. */
  breathe: { scale: number };
  /** A glint that sweeps across the gold now and then. */
  shine: { everyMs: number; sweepMs: number; alpha: number; width: number };
  /** Stars that twinkle on the lettering, at these points of the texture (shares of its size). */
  sparkles: { points: readonly (readonly [number, number])[]; size: number; periodMs: number };
}

/**
 * The game logo with a little life in it. The layout places and scales `view`; the motion stays
 * inside it, so it never fights the layout. A sprite of the logo itself masks the glint, so the
 * light runs only over the lettering. Creates nothing per frame.
 */
export class TitleLogo {
  readonly view = new Container({ label: 'titleLogo' });
  private readonly body = new Container();
  private readonly glint: Sprite;
  private readonly sparkles: Sprite[];
  private readonly halfWidth: number;
  private timeMs = 0;

  constructor(
    logo: Texture,
    spark: Texture,
    ticker: Ticker,
    private readonly look: TitleLogoLook,
  ) {
    const sprite = new Sprite({ texture: logo, anchor: 0.5 });
    const mask = new Sprite({ texture: logo, anchor: 0.5 });
    this.glint = new Sprite({ texture: glintTexture(), anchor: 0.5, blendMode: 'add' });
    this.glint.setSize(look.shine.width, logo.height * 1.6);
    this.glint.rotation = 0.35;
    this.glint.mask = mask;
    this.sparkles = look.sparkles.points.map(([x, y]) => {
      const star = new Sprite({ texture: spark, anchor: 0.5, blendMode: 'add' });
      star.position.set((x - 0.5) * logo.width, (y - 0.5) * logo.height);
      star.setSize(look.sparkles.size);
      return star;
    });
    this.body.addChild(sprite, mask, this.glint, ...this.sparkles);
    this.view.addChild(this.body);
    this.halfWidth = logo.width / 2;
    // The motion is decoration: with reduced motion asked for, the logo simply stands still.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      this.glint.visible = false;
      this.sparkles.forEach((star) => (star.visible = false));
      return;
    }
    ticker.add(this.update);
  }

  private readonly update = (ticker: Ticker): void => {
    this.timeMs += ticker.deltaMS;
    const { bob, breathe, shine, sparkles } = this.look;
    const phase = (this.timeMs / bob.periodMs) * Math.PI * 2;
    this.body.y = Math.sin(phase) * bob.height;
    this.body.scale.set(1 + Math.sin(phase - 0.8) * breathe.scale);

    // The glint crosses from left to right once per `everyMs`, and is off the logo otherwise.
    const sweep = (this.timeMs % shine.everyMs) / shine.sweepMs;
    const reach = this.halfWidth + shine.width;
    this.glint.visible = sweep < 1;
    this.glint.x = -reach + sweep * reach * 2;
    this.glint.alpha = shine.alpha * Math.sin(Math.min(sweep, 1) * Math.PI);

    this.sparkles.forEach((star, index) => {
      // Each star flares in its own slot of the period and rests the rest of the time.
      const local = ((this.timeMs / sparkles.periodMs + index / this.sparkles.length) % 1) * 3;
      const flare = local < 1 ? Math.sin(local * Math.PI) : 0;
      star.alpha = flare;
      star.scale.set((sparkles.size / star.texture.width) * (0.4 + flare * 0.8));
      star.rotation = local * 0.8;
    });
  };
}

/** A soft vertical band of light, bright in the middle and fading to both sides. */
function glintTexture(): Texture {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 8;
  const context = canvas.getContext('2d');
  if (context) {
    const gradient = context.createLinearGradient(0, 0, 64, 0);
    gradient.addColorStop(0, 'rgba(255,248,210,0)');
    gradient.addColorStop(0.5, 'rgba(255,248,210,1)');
    gradient.addColorStop(1, 'rgba(255,248,210,0)');
    context.fillStyle = gradient;
    context.fillRect(0, 0, 64, 8);
  }
  return Texture.from(canvas);
}
