// Browser side of the layout: when to re-apply it and what the safe areas are.
// The geometry lives in `layoutMath.ts`, the placing of objects in `LayoutManager`.

import type { Application } from 'pixi.js';
import type { LayoutManager } from './LayoutManager';
import type { Insets } from './layoutMath';

const MAX_RESOLUTION = 2;

/**
 * Keeps `layout` in sync with the page. `host` is the element the canvas is sized to
 * (`resizeTo`). Its padding is read as the safe area, so the page sets it to
 * `env(safe-area-inset-*)`.
 *
 * Every source of change only asks Pixi for a resize with `app.queueResize()`. Pixi keeps at most
 * one resize per animation frame, and the layout is applied once, on the renderer's `resize` event.
 */
export function connectLayoutToPage(
  app: Application,
  host: HTMLElement,
  layout: LayoutManager,
): void {
  const applyLayout = (): void => {
    // Browser zoom and moving the window to another monitor change devicePixelRatio.
    // The setter only reallocates the canvas buffer, so it does not fire "resize" again.
    const resolution = screenResolution();
    if (app.renderer.resolution !== resolution) {
      app.renderer.resolution = resolution;
    }
    layout.resize(app.screen, readSafeAreaInsets(host));
  };
  app.renderer.on('resize', applyLayout);
  applyLayout();

  // Pixi itself listens only to window "resize". The observer also sees the host change size
  // without it, e.g. 100dvh growing when a mobile browser hides its toolbar.
  new ResizeObserver(() => {
    app.queueResize();
  }).observe(host);
  // Turning a phone from one landscape side to the other keeps the size, so nothing above fires,
  // but the notch moves to the other edge and the safe-area insets change.
  window.addEventListener('orientationchange', () => {
    app.queueResize();
  });
}

/**
 * Resolution of the canvas buffer: the device pixel ratio, but at most 2.
 * Above 2× a phone screen looks the same, while the GPU fills 2.25 times more pixels (3× vs 2×).
 */
export function screenResolution(): number {
  return Math.min(window.devicePixelRatio, MAX_RESOLUTION);
}

function readSafeAreaInsets(host: HTMLElement): Insets {
  const style = getComputedStyle(host);
  return {
    top: parseFloat(style.paddingTop),
    right: parseFloat(style.paddingRight),
    bottom: parseFloat(style.paddingBottom),
    left: parseFloat(style.paddingLeft),
  };
}
