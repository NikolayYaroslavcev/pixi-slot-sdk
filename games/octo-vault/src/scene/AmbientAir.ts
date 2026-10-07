import { Container, Sprite, Texture, type ColorSource, type Ticker } from 'pixi.js';
import { easeOutQuad, tween, type LayoutManager, type Tween } from 'slot-sdk';

/** How the air of the cove moves. Sizes are design pixels, speeds design pixels per second. */
export interface AmbientAirLook {
  rays: { alpha: number; swayDegrees: number; periodMs: number };
  /** Two kinds of glowing specks rising through the light, each in its own color. */
  dust: DrifterLook & { alpha: number; color: ColorSource };
  embers: DrifterLook & { alpha: number; color: ColorSource };
  /** Free spins tint the scene to this color, at this strength. */
  freeSpins: { color: ColorSource; alpha: number; fadeMs: number };
}

export interface DrifterLook {
  count: number;
  minSize: number;
  maxSize: number;
  minSpeed: number;
  maxSpeed: number;
  /** Side to side swing while rising. */
  wobble: number;
}

type Area = { x: number; y: number; width: number; height: number };

/** A speck rising through the light. Created once, moved back under the screen when it leaves. */
interface Drifter {
  readonly sprite: Sprite;
  readonly look: DrifterLook;
  speed: number;
  /** Horizontal place as a share of the visible width, so it survives a resize. */
  share: number;
  phase: number;
}

/**
 * Life in the background: two shafts of sunlight swaying slowly, and dust and embers rising
 * in them. A fixed set of sprites is created once and moved every frame; whatever leaves the
 * top comes back from below. It covers the whole visible area, read every frame, so resizes
 * and rotations need nothing extra. Free spins tint the scene with a colored cover.
 */
export class AmbientAir {
  readonly view = new Container({ label: 'ambientAir' });
  private readonly rays: Sprite[];
  private readonly drifters: Drifter[];
  private readonly mood = new Sprite(Texture.WHITE);
  private moodFade: Tween<Sprite> | null = null;
  private timeMs = 0;
  private started = false;

  constructor(
    textures: { rays: Texture; mote: Texture },
    private readonly layout: Pick<LayoutManager, 'visibleArea'>,
    private readonly ticker: Ticker,
    private readonly look: AmbientAirLook,
  ) {
    this.rays = [0, 1].map(
      () => new Sprite({ texture: textures.rays, anchor: { x: 0.5, y: 0 }, blendMode: 'add' }),
    );
    const create = (drifterLook: DrifterLook): Drifter[] =>
      Array.from({ length: drifterLook.count }, () => ({
        sprite: new Sprite({ texture: textures.mote, anchor: 0.5 }),
        look: drifterLook,
        speed: 0,
        share: 0,
        phase: 0,
      }));
    const tinted = (drifterLook: AmbientAirLook['dust']): Drifter[] =>
      create(drifterLook).map((speck) => {
        speck.sprite.alpha = drifterLook.alpha;
        speck.sprite.tint = drifterLook.color;
        speck.sprite.blendMode = 'add';
        return speck;
      });
    this.drifters = [...tinted(look.dust), ...tinted(look.embers)];
    this.mood.tint = look.freeSpins.color;
    this.mood.alpha = 0;
    this.view.addChild(...this.rays, ...this.drifters.map((each) => each.sprite), this.mood);
    ticker.add(this.update);
  }

  /** Tints the scene for free spins, or clears it, over a short fade. */
  setFreeSpins(active: boolean): void {
    this.moodFade?.finish();
    const { alpha, fadeMs } = this.look.freeSpins;
    this.moodFade = tween(
      this.ticker,
      this.mood,
      { alpha: active ? alpha : 0 },
      { duration: fadeMs, easing: easeOutQuad },
    );
  }

  // Creates nothing per frame.
  private readonly update = (ticker: Ticker): void => {
    const area = this.layout.visibleArea;
    if (!area) {
      return;
    }
    if (!this.started) {
      this.scatter(area);
    }
    this.timeMs += ticker.deltaMS;
    this.mood.position.set(area.x, area.y);
    this.mood.setSize(area.width, area.height);
    this.swayRays(area);
    const seconds = ticker.deltaMS / 1000;
    for (const drifter of this.drifters) {
      this.rise(drifter, area, seconds);
    }
  };

  /** The first frame finds the air already full: drifters start all over the screen. */
  private scatter(area: Area): void {
    this.started = true;
    for (const drifter of this.drifters) {
      this.respawn(drifter, area.y + Math.random() * area.height);
    }
  }

  private swayRays(area: Area): void {
    const { alpha, swayDegrees, periodMs } = this.look.rays;
    this.rays.forEach((ray, index) => {
      const phase = (this.timeMs / periodMs) * Math.PI * 2 + index * 2.1;
      ray.position.set(area.x + area.width * (0.28 + index * 0.44), area.y - 20);
      ray.setSize(area.width * 0.7, area.height * 1.1);
      ray.rotation = ((Math.sin(phase) * swayDegrees) / 180) * Math.PI;
      ray.alpha = alpha * (0.7 + 0.3 * Math.sin(phase * 0.7 + 1));
    });
  }

  private rise(drifter: Drifter, area: Area, seconds: number): void {
    const { sprite, look } = drifter;
    const swing = Math.sin(this.timeMs / 700 + drifter.phase) * look.wobble;
    sprite.x = area.x + drifter.share * area.width + swing;
    sprite.y -= drifter.speed * seconds;
    // After a resize the area may have moved: bring back whatever ended up far outside it.
    const outside = sprite.y < area.y - sprite.height || sprite.y > area.y + area.height * 2;
    if (outside) {
      this.respawn(drifter, area.y + area.height + sprite.height);
    }
  }

  private respawn(drifter: Drifter, y: number): void {
    const { minSize, maxSize, minSpeed, maxSpeed } = drifter.look;
    drifter.share = Math.random();
    drifter.phase = Math.random() * Math.PI * 2;
    drifter.speed = minSpeed + Math.random() * (maxSpeed - minSpeed);
    drifter.sprite.setSize(minSize + Math.random() * (maxSize - minSize));
    drifter.sprite.y = y;
  }
}
