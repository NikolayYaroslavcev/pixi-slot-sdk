import type { Rectangle, Renderer } from 'pixi.js';

export type ResizeListener = (width: number, height: number) => void;

/** Knows the screen size and tells subscribers when it changes. */
export class LayoutManager {
  constructor(private readonly renderer: Renderer) {}

  /** Visible area in CSS pixels. */
  get screen(): Rectangle {
    return this.renderer.screen;
  }

  /** Calls `listener` right away with the current size, then after every resize. */
  onResize(listener: ResizeListener): void {
    listener(this.screen.width, this.screen.height);
    this.renderer.on('resize', (width, height) => {
      listener(width, height);
    });
  }
}
