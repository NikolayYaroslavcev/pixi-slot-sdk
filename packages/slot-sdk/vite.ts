import type { UserConfig } from 'vite';

/**
 * Shared Vite config for every game in `games/*`.
 * A relative `base` lets the build run from any sub-path, e.g. GitHub Pages.
 */
export function createViteConfig(): UserConfig {
  return {
    base: './',
  };
}
