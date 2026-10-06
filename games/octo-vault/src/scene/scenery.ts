import { Assets, Sprite, Text, type Texture } from 'pixi.js';
import type { Feature } from 'slot-sdk';

/** Everything behind and around the reels: the sea background and the game title. */
export function scenery(): Feature {
  return {
    install(context) {
      const background = new Sprite(Assets.get<Texture>('background'));
      context.layers.background.addChild(background);
      context.layout.setBackground(background);

      const title = new Text({
        text: 'OCTO VAULT',
        style: { fill: '#e8fbff', fontSize: 88, fontFamily: 'Lilita One', letterSpacing: 4 },
      });
      context.layers.scene.addChild(title);
      context.layout.addNode('title', title);
    },
  };
}
