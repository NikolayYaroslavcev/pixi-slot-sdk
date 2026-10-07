import { Sprite, Texture, type ColorSource, type Container } from 'pixi.js';
import type { LayoutManager } from '../layout/LayoutManager';

/** A sprite that darkens the screen behind an overlay. `placeOverlay` sizes it. */
export function createDim(color: ColorSource, alpha: number): Sprite {
  const dim = new Sprite(Texture.WHITE);
  dim.tint = color;
  dim.alpha = alpha;
  return dim;
}

/** How an overlay's content fits the design area: its natural size and the share it may take. */
export interface OverlayFit {
  width: number;
  /** Without a height only the width limits the content. */
  height?: number;
  maxWidthShare: number;
  maxHeightShare?: number;
  /** Extra scale on top of the fit, e.g. while the content pops in. */
  scale?: number;
}

/**
 * Places a full-screen overlay for the current layout: `dim` covers the whole canvas, beyond the
 * design area too, and `content` is centered in the design area and shrunk to fit it, never
 * enlarged. Call it every frame the overlay is shown, so resizes and rotations follow at once.
 */
export function placeOverlay(
  layout: LayoutManager,
  parts: { dim: Sprite; content: Container },
  fit: OverlayFit,
): void {
  const area = layout.visibleArea;
  const variant = layout.variant;
  if (!area || !variant) {
    return;
  }
  parts.dim.position.set(area.x, area.y);
  parts.dim.setSize(area.width, area.height);
  parts.content.position.set(variant.width / 2, variant.height / 2);
  const byWidth = (variant.width * fit.maxWidthShare) / fit.width;
  const byHeight = fit.height ? (variant.height * (fit.maxHeightShare ?? 1)) / fit.height : 1;
  parts.content.scale.set(Math.min(1, byWidth, byHeight) * (fit.scale ?? 1));
}
