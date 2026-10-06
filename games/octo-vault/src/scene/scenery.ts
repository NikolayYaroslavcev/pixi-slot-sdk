import { Assets, Sprite, type Texture } from 'pixi.js';
import type { Feature } from 'slot-sdk';
import { ambientSeaLook } from '../config/scenery.config';
import { AmbientSea } from './AmbientSea';

/**
 * Everything behind and around the reels: the deep-sea background with its moving water,
 * and the game logo. Free spins darken the water (`freeSpinsActive`).
 */
export function scenery(): Feature {
  return {
    install(context) {
      const background = new Sprite(Assets.get<Texture>('background'));
      context.layers.background.addChild(background);
      context.layout.setBackground(background);

      const textures = {
        rays: Assets.get<Texture>('lightRays'),
        bubble: Assets.get<Texture>('bubble'),
      };
      const sea = new AmbientSea(textures, context.layout, context.app.ticker, ambientSeaLook);
      context.layers.background.addChild(sea.view);
      context.events.on('freeSpinsActive', (active) => {
        sea.setFreeSpins(active);
      });

      const logo = new Sprite({ texture: Assets.get<Texture>('logo'), anchor: 0.5 });
      context.layers.scene.addChild(logo);
      context.layout.addNode('title', logo);
    },
  };
}
