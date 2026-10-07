import type { Container, Sprite } from 'pixi.js';
import type { LayoutConfig, LayoutNode, LayoutVariant } from './LayoutConfig';
import {
  fitContain,
  fitCover,
  insetArea,
  pickVariant,
  toDesignArea,
  type Area,
  type Fit,
  type Insets,
  type Size,
} from './layoutMath';

/** What the last `resize` decided. */
interface Placement {
  variant: LayoutVariant;
  viewport: Size;
  rootFit: Fit;
}

/**
 * Fits the design root into the screen and places named objects inside it.
 *
 * Everything under the root uses design coordinates of the current variant (for example
 * 1920 × 1080). Only `resize` deals with CSS pixels. Adding an object to a layer decides its
 * draw order; registering it here decides where it goes.
 */
export class LayoutManager {
  private readonly nodes = new Map<string, Container>();
  private background?: Sprite;
  private placement?: Placement;

  constructor(
    private readonly root: Container,
    private readonly config: LayoutConfig,
  ) {}

  /** The variant on screen, or undefined before the first resize. */
  get variant(): LayoutVariant | undefined {
    return this.placement?.variant;
  }

  /**
   * The whole canvas in design coordinates, with the strips around the design area and
   * under the insets. Undefined before the first resize. For what must cover the screen.
   */
  get visibleArea(): Area | undefined {
    if (!this.placement) {
      return undefined;
    }
    const { viewport, rootFit } = this.placement;
    return toDesignArea({ x: 0, y: 0, ...viewport }, rootFit);
  }

  get placedNodes(): ReadonlyMap<string, Container> {
    return this.nodes;
  }

  /**
   * Places `object` by the node `name` of the layout config, now and after every resize.
   * From then on the layout owns its position, scale, pivot and visibility.
   */
  addNode(name: string, object: Container): void {
    if (!Object.hasOwn(this.config.landscape.nodes, name)) {
      throw new Error(`LayoutManager: node "${name}" is not in the layout config`);
    }
    if (this.nodes.has(name)) {
      throw new Error(`LayoutManager: node "${name}" is already added`);
    }
    this.nodes.set(name, object);
    this.placeNode(name, object);
  }

  /** Scales `sprite` to cover the whole viewport, including the strips around the design area. */
  setBackground(sprite: Sprite): void {
    sprite.anchor.set(0);
    this.background = sprite;
    this.placeBackground();
  }

  /**
   * Re-applies the layout. `viewport` is the canvas size and `insets` the notches and
   * system bars, both in CSS pixels. The design area avoids the insets, the background does not.
   */
  resize(viewport: Size, insets: Insets): void {
    const safeArea = insetArea(viewport, insets);
    // A hidden or collapsed page has nothing to fit into: keep the last layout.
    if (safeArea.width === 0 || safeArea.height === 0) {
      return;
    }
    const variant = this.config[pickVariant(safeArea)];
    const rootFit = fitContain(variant, safeArea);
    this.root.scale.set(rootFit.scale);
    this.root.position.set(rootFit.x, rootFit.y);
    this.placement = { variant, viewport, rootFit };

    this.placeBackground();
    for (const [name, object] of this.nodes) {
      this.placeNode(name, object);
    }
  }

  private placeBackground(): void {
    const visibleArea = this.visibleArea;
    if (!this.background || !visibleArea) {
      return;
    }
    const cover = fitCover(this.background.texture, visibleArea);
    this.background.scale.set(cover.scale);
    this.background.position.set(cover.x, cover.y);
  }

  private placeNode(name: string, object: Container): void {
    if (!this.placement) {
      return;
    }
    const node = this.placement.variant.nodes[name];
    if (!node) {
      throw new Error(`LayoutManager: node "${name}" is missing in one of the variants`);
    }
    object.position.set(node.x, node.y);
    object.scale.set(node.scale ?? 1);
    object.visible = node.visible ?? true;
    setPivot(object, node.anchor);
  }
}

/** Moves the pivot to the anchor point of the object's current bounds, or to its origin. */
function setPivot(object: Container, anchor: LayoutNode['anchor']): void {
  if (!anchor) {
    object.pivot.set(0);
    return;
  }
  const bounds = object.getLocalBounds();
  object.pivot.set(bounds.x + bounds.width * anchor.x, bounds.y + bounds.height * anchor.y);
}
