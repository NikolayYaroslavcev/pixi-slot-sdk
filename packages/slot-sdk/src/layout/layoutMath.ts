// Pure geometry of the layout. No Pixi and no DOM here: every function is tested in Node.
// Units are stated per argument: "viewport" values are CSS pixels, "design" values are
// coordinates of the layout config.

import type { LayoutVariantName } from './LayoutConfig';

export interface Size {
  width: number;
  height: number;
}

/** A rectangle: top-left corner and size. */
export interface Area extends Size {
  x: number;
  y: number;
}

/** Where to put content and how much to scale it so it fits an area. */
export interface Fit {
  scale: number;
  x: number;
  y: number;
}

/** Space taken by notches and system bars on each side, CSS pixels. */
export interface Insets {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

/** Wider than tall (or square) is landscape, otherwise portrait. */
export function pickVariant(viewport: Size): LayoutVariantName {
  return viewport.width >= viewport.height ? 'landscape' : 'portrait';
}

/** Scales `content` to fit entirely inside `area` and centers it. Parts of the area may stay empty. */
export function fitContain(content: Size, area: Area): Fit {
  const scale = Math.min(area.width / content.width, area.height / content.height);
  return centerIn(content, area, scale);
}

/** Scales `content` to fill the whole `area` and centers it. Parts of the content may be cut off. */
export function fitCover(content: Size, area: Area): Fit {
  const scale = Math.max(area.width / content.width, area.height / content.height);
  return centerIn(content, area, scale);
}

function centerIn(content: Size, area: Area, scale: number): Fit {
  return {
    scale,
    x: area.x + (area.width - content.width * scale) / 2,
    y: area.y + (area.height - content.height * scale) / 2,
  };
}

/** The part of the viewport that is not covered by notches and system bars. */
export function insetArea(viewport: Size, insets: Insets): Area {
  return {
    x: insets.left,
    y: insets.top,
    width: Math.max(0, viewport.width - insets.left - insets.right),
    height: Math.max(0, viewport.height - insets.top - insets.bottom),
  };
}

/**
 * Converts a rectangle in viewport pixels into design coordinates of a root placed with `fit`.
 * Used to cover the whole viewport, including the empty strips around the design area.
 */
export function toDesignArea(viewportArea: Area, fit: Fit): Area {
  return {
    x: (viewportArea.x - fit.x) / fit.scale,
    y: (viewportArea.y - fit.y) / fit.scale,
    width: viewportArea.width / fit.scale,
    height: viewportArea.height / fit.scale,
  };
}
