import { Assets, Container, Graphics, Sprite, Text, type Texture } from 'pixi.js';
import { easeInOutQuad, tween, wait, type Feature, type GameContext } from 'slot-sdk';
import { assets } from '../assets';

// Sizes are in design coordinates (`layout.ts`), not screen pixels.
const SWING_DISTANCE = 120;
const SWING_ROTATION = 0.2;
const SWING_DURATION_MS = 900;
const PAUSE_MS = 300;
const RECTANGLE_WIDTH = 360;
const RECTANGLE_HEIGHT = 240;
const LABEL_OFFSET_Y = 180;
const LABEL_FONT_SIZE = 56;
const SYMBOL_SIZE = 160;
const SYMBOL_GAP = 20;
const SYMBOLS_PER_ROW = 5;

/**
 * Temporary scene that shows the SDK core at work until the reels exist:
 * a rectangle swings with `tween`, and every swing adds the bet to the last win,
 * which reaches the label through a model event. Next to it, every symbol placeholder,
 * and behind everything the background from the `game` bundle. `layout.ts` places all three.
 */
export function coreDemo(): Feature {
  return {
    install(context) {
      const background = new Sprite(Assets.get<Texture>('background'));
      context.layers.background.addChild(background);
      context.layout.setBackground(background);

      const symbols = createSymbolStrip(context);
      const demo = new Container({ label: 'demo' });
      const rectangle = new Graphics()
        .rect(-RECTANGLE_WIDTH / 2, -RECTANGLE_HEIGHT / 2, RECTANGLE_WIDTH, RECTANGLE_HEIGHT)
        .fill('#f2b134');
      const winLabel = new Text({
        text: 'Win: 0',
        style: { fill: '#ffffff', fontSize: LABEL_FONT_SIZE, fontFamily: 'Lilita One' },
      });
      winLabel.anchor.set(0.5);
      winLabel.y = LABEL_OFFSET_Y;
      demo.addChild(rectangle, winLabel);
      context.layers.scene.addChild(symbols, demo);
      context.layout.addNode('symbols', symbols);
      context.layout.addNode('demo', demo);
      context.events.on('lastWinChanged', (lastWin) => {
        winLabel.text = `Win: ${String(lastWin)}`;
      });
      void swingForever(context, rectangle);
    },
  };
}

function createSymbolStrip(context: GameContext): Container {
  const strip = new Container({ label: 'symbols' });
  Object.keys(assets.symbols).forEach((symbolId, index) => {
    const sprite = new Sprite(context.assets.symbolTexture(symbolId));
    sprite.setSize(SYMBOL_SIZE);
    const column = index % SYMBOLS_PER_ROW;
    const row = Math.floor(index / SYMBOLS_PER_ROW);
    sprite.position.set(column * (SYMBOL_SIZE + SYMBOL_GAP), row * (SYMBOL_SIZE + SYMBOL_GAP));
    strip.addChild(sprite);
  });
  return strip;
}

async function swingForever(context: GameContext, rectangle: Graphics): Promise<void> {
  const { ticker } = context.app;
  for (let direction = 1; ; direction = -direction) {
    await tween(
      ticker,
      rectangle,
      { x: direction * SWING_DISTANCE, rotation: direction * SWING_ROTATION },
      { duration: SWING_DURATION_MS, easing: easeInOutQuad },
    );
    context.model.setLastWin(context.model.lastWin + context.model.bet);
    await wait(ticker, PAUSE_MS);
  }
}
