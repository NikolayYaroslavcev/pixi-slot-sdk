import { Assets, Sprite, type Texture } from 'pixi.js';
import type { Feature } from 'slot-sdk';
import { ambientAirLook, titleLogoLook } from '../config/scenery.config';
import { AmbientAir } from './AmbientAir';
import { TitleLogo } from './TitleLogo';

/**
 * Everything behind and around the reels: the pirate cove at sunset with light and embers
 * moving in it, and the game logo. Free spins tint the cove (`freeSpinsActive`).
 */
export function scenery(): Feature {
  return {
    install(context) {
      const background = new Sprite(Assets.get<Texture>('background'));
      context.layers.background.addChild(background);
      context.layout.setBackground(background);

      const textures = {
        rays: Assets.get<Texture>('lightRays'),
        mote: Assets.get<Texture>('mote'),
      };
      const air = new AmbientAir(textures, context.layout, context.app.ticker, ambientAirLook);
      context.layers.background.addChild(air.view);
      context.events.on('freeSpinsActive', (active) => {
        air.setFreeSpins(active);
      });

      const logo = new TitleLogo(
        Assets.get<Texture>('logo'),
        Assets.get<Texture>('spark'),
        context.app.ticker,
        titleLogoLook,
      );
      context.layers.scene.addChild(logo.view);
      context.layout.addNode('title', logo.view);
    },
  };
}
