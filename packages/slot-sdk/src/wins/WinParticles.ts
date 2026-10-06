import {
  Graphics,
  Particle,
  ParticleContainer,
  Rectangle,
  type ColorSource,
  type Renderer,
} from 'pixi.js';

/** How Big Win particles fly. Distances are design pixels, times milliseconds. */
export interface ParticleStyle {
  /** Particles take these colors at random. */
  colors: readonly ColorSource[];
  /** Radius of a particle at scale 1. */
  radius: number;
  lifeMs: number;
  /** Largest speed a particle is thrown with, per second. */
  speed: number;
  /** Pull down, per second squared. */
  gravity: number;
}

/** A particle and what it needs besides what `Particle` stores. */
interface Motion {
  particle: Particle;
  velocityX: number;
  velocityY: number;
  ageMs: number;
}

/**
 * A fountain of glowing particles thrown up from one point and falling back.
 * One `ParticleContainer`: hundreds of particles cost a single draw call.
 */
export class WinParticles {
  readonly view: ParticleContainer;
  private readonly motions: Motion[] = [];
  private perSecond = 0;
  /** Part of the next particle accumulated by the frames since the last one. */
  private due = 0;

  constructor(
    renderer: Renderer,
    private readonly style: ParticleStyle,
  ) {
    const dot = new Graphics().circle(0, 0, style.radius).fill(0xffffff);
    const texture = renderer.generateTexture(dot);
    dot.destroy();
    this.view = new ParticleContainer({
      texture,
      blendMode: 'add',
      dynamicProperties: { position: true, vertex: true, color: true },
      // Without bounds the container would count as empty and could be culled.
      boundsArea: new Rectangle(-4000, -4000, 8000, 8000),
    });
  }

  /** Starts throwing `perSecond` particles from the origin of the view. */
  start(perSecond: number): void {
    this.perSecond = perSecond;
    this.due = 0;
  }

  /** Stops throwing and removes every particle at once. */
  stop(): void {
    this.perSecond = 0;
    this.motions.length = 0;
    this.view.particleChildren.length = 0;
    this.view.update();
  }

  update(deltaMs: number): void {
    this.due += (this.perSecond * deltaMs) / 1000;
    for (; this.due >= 1; this.due -= 1) {
      this.throwOne();
    }
    this.move(deltaMs);
  }

  private throwOne(): void {
    const { colors, speed } = this.style;
    // Mostly up, fanned out to the sides.
    const angle = -Math.PI / 2 + (Math.random() - 0.5) * 1.6;
    const throwSpeed = speed * (0.5 + Math.random() * 0.5);
    const size = 0.5 + Math.random();
    const color = colors[Math.floor(Math.random() * colors.length)] ?? 0xffffff;
    const particle = new Particle({
      texture: this.view.texture,
      anchorX: 0.5,
      anchorY: 0.5,
      scaleX: size,
      scaleY: size,
      tint: color,
    });
    this.view.addParticle(particle);
    this.motions.push({
      particle,
      velocityX: Math.cos(angle) * throwSpeed,
      velocityY: Math.sin(angle) * throwSpeed,
      ageMs: 0,
    });
  }

  /** Moves every particle, fades it with age and drops the ones that lived their time. */
  private move(deltaMs: number): void {
    const seconds = deltaMs / 1000;
    const particles = this.view.particleChildren;
    const countBefore = particles.length;
    for (let index = particles.length - 1; index >= 0; index -= 1) {
      const motion = this.motions[index];
      if (!motion) {
        continue;
      }
      const { particle } = motion;
      motion.ageMs += deltaMs;
      motion.velocityY += this.style.gravity * seconds;
      particle.x += motion.velocityX * seconds;
      particle.y += motion.velocityY * seconds;
      particle.alpha = Math.max(1 - motion.ageMs / this.style.lifeMs, 0);
      if (motion.ageMs >= this.style.lifeMs) {
        particles.splice(index, 1);
        this.motions.splice(index, 1);
      }
    }
    if (particles.length !== countBefore) {
      this.view.update();
    }
  }
}
