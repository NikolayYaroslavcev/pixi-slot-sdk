import { Container, Graphics, Text } from 'pixi.js';
import { easeInOutQuad, tween, wait, type Feature, type GameContext } from 'slot-sdk';

// Small enough to stay on a 375 px wide phone: the scene is not scaled to the screen yet.
const SWING_DISTANCE = 60;
const SWING_ROTATION = 0.2;
const SWING_DURATION_MS = 900;
const PAUSE_MS = 300;

/**
 * Temporary scene that shows the SDK core at work until the reels exist:
 * a rectangle swings with `tween`, and every swing adds the bet to the last win,
 * which reaches the label through a model event.
 */
export function coreDemo(): Feature {
  return {
    install(context) {
      const group = new Container();
      const rectangle = new Graphics().rect(-120, -80, 240, 160).fill('#f2b134');
      const winLabel = new Text({ text: 'Win: 0', style: { fill: '#ffffff', fontSize: 32 } });
      winLabel.anchor.set(0.5);
      winLabel.y = 140;
      group.addChild(rectangle, winLabel);
      context.layers.scene.addChild(group);

      context.layout.onResize((width, height) => {
        group.position.set(width / 2, height / 2);
      });
      context.events.on('lastWinChanged', (lastWin) => {
        winLabel.text = `Win: ${String(lastWin)}`;
      });
      void swingForever(context, rectangle);
    },
  };
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
