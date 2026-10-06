import { Graphics, type Container } from 'pixi.js';
import type { LayoutManager } from './LayoutManager';

const DESIGN_AREA_COLOR = '#ff3df5';
const NODE_BOUNDS_COLOR = '#3dffb4';
/** Half the length of the cross that marks a node's `x, y`, design units. */
const NODE_MARKER_SIZE = 24;

/** True when the page address asks for the layout debug view: `?debug=layout`. */
export function isLayoutDebugEnabled(search: string): boolean {
  return new URLSearchParams(search).getAll('debug').includes('layout');
}

/**
 * Draws the frame of the design area, a cross at each node's layout point and the node's
 * current bounds. Call `draw` every frame: animated nodes change their bounds.
 */
export class LayoutDebug {
  private readonly graphics = new Graphics({ label: 'layoutDebug' });

  constructor(
    layer: Container,
    private readonly layout: LayoutManager,
  ) {
    layer.addChild(this.graphics);
  }

  draw(): void {
    const { graphics, layout } = this;
    graphics.clear();
    if (!layout.variant) {
      return;
    }
    // pixelLine keeps lines one screen pixel wide at any scale of the design root.
    graphics
      .rect(0, 0, layout.variant.width, layout.variant.height)
      .stroke({ color: DESIGN_AREA_COLOR, pixelLine: true });
    for (const object of layout.placedNodes.values()) {
      if (object.visible) {
        this.drawNode(object);
      }
    }
  }

  private drawNode(object: Container): void {
    const { graphics } = this;
    const bounds = object.getBounds();
    const topLeft = graphics.toLocal({ x: bounds.minX, y: bounds.minY });
    const bottomRight = graphics.toLocal({ x: bounds.maxX, y: bounds.maxY });
    graphics
      .rect(topLeft.x, topLeft.y, bottomRight.x - topLeft.x, bottomRight.y - topLeft.y)
      .stroke({ color: NODE_BOUNDS_COLOR, pixelLine: true });
    const { x, y } = object.position;
    graphics
      .moveTo(x - NODE_MARKER_SIZE, y)
      .lineTo(x + NODE_MARKER_SIZE, y)
      .moveTo(x, y - NODE_MARKER_SIZE)
      .lineTo(x, y + NODE_MARKER_SIZE)
      .stroke({ color: NODE_BOUNDS_COLOR, pixelLine: true });
  }
}
