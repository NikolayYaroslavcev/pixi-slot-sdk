import { Assets, Container, Graphics, Sprite, Text, type Texture } from 'pixi.js';
import { easeInOutQuad, tween, wait, type Feature, type GameContext } from 'slot-sdk';
import { assets } from '../assets';

// Small enough to stay on a 375 px wide phone: the scene is not scaled to the screen yet.
const SWING_DISTANCE = 60;
const SWING_ROTATION = 0.2;
const SWING_DURATION_MS = 900;
const PAUSE_MS = 300;
const SYMBOL_SIZE = 48;
const SYMBOL_GAP = 8;
const SYMBOLS_PER_ROW = 5;
const SYMBOLS_TOP = 12;

/**
 * Temporary scene that shows the SDK core at work until the reels exist:
 * a rectangle swings with `tween`, and every swing adds the bet to the last win,
 * which reaches the label through a model event. Above it, every symbol placeholder,
 * and behind everything the background from the `game` bundle.
 */
export function coreDemo(): Feature {
  return {
    install(context) {
      const background = new Sprite(Assets.get<Texture>('background'));
      context.layers.background.addChild(background);
      const symbols = createSymbolStrip(context);
      const group = new Container();
      const rectangle = new Graphics().rect(-120, -80, 240, 160).fill('#f2b134');
      const winLabel = new Text({
        text: 'Win: 0',
        style: { fill: '#ffffff', fontSize: 32, fontFamily: 'Lilita One' },
      });
      winLabel.anchor.set(0.5);
      winLabel.y = 110;
      group.addChild(rectangle, winLabel);
      context.layers.scene.addChild(symbols, group);

      context.layout.onResize((width, height) => {
        // Stretched to the screen for now. The layout stage replaces this with cover scaling.
        background.setSize(width, height);
        symbols.position.set((width - symbols.width) / 2, SYMBOLS_TOP);
        const symbolsBottom = symbols.y + symbols.height;
        group.position.set(width / 2, symbolsBottom + (height - symbolsBottom) / 2);
      });
      context.events.on('lastWinChanged', (lastWin) => {
        winLabel.text = `Win: ${String(lastWin)}`;
      });
      void swingForever(context, rectangle);
    },
  };
}

function createSymbolStrip(context: GameContext): Container {
  const strip = new Container();
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
