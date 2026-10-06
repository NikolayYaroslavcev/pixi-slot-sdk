import { Container, Text, type ColorSource } from 'pixi.js';
import type { GameContext } from '../core/GameContext';
import { Button, type ButtonStyle } from './Button';
import {
  HudPresenter,
  type HudPresenterDependencies,
  type HudTexts,
  type HudView,
} from './HudPresenter';
import { LabeledValue } from './LabeledValue';

/** Layout nodes of the HUD. Every game's `layout.ts` places each of them in both variants. */
export const hudNodeNames = ['spinButton', 'balance', 'bet', 'win', 'message'] as const;

export type HudNodeName = (typeof hudNodeNames)[number];

/** Look of the HUD, set by the game. Sizes are design pixels; positions come from the layout. */
export interface HudStyle {
  fontFamily: string;
  textColor: ColorSource;
  captionColor: ColorSource;
  buttonColor: ColorSource;
  buttonTextColor: ColorSource;
  captionFontSize: number;
  valueFontSize: number;
  messageFontSize: number;
  spinButton: { radius: number; fontSize: number };
  /** The − and + buttons around the bet. `offset` is from the bet's center to theirs. */
  betButtons: { size: number; fontSize: number; offset: number };
  texts: HudTexts;
}

/** Keys that press Spin, as on most slot sites. */
const spinKeys = new Set(['Space', 'Enter']);

/**
 * Balance, bet with − / +, win, a message line and the Spin / Stop button.
 * A plain class, not ECS. It draws what `HudPresenter` decides and passes presses back to it.
 */
export class Hud {
  private readonly balance: LabeledValue;
  private readonly win: LabeledValue;
  private readonly bet: LabeledValue;
  private readonly message: Text;
  private readonly spinButton: Button;
  private readonly betDown: Button;
  private readonly betUp: Button;

  constructor(
    context: Pick<GameContext, 'layers' | 'layout'>,
    dependencies: Omit<HudPresenterDependencies, 'texts'>,
    style: HudStyle,
  ) {
    const { texts } = style;
    const valueStyle = { ...style, valueColor: style.textColor };
    this.balance = new LabeledValue(texts.balance, valueStyle);
    this.win = new LabeledValue(texts.win, valueStyle);
    this.bet = new LabeledValue(texts.bet, valueStyle);
    this.message = new Text({
      anchor: 0.5,
      style: {
        fill: style.textColor,
        fontFamily: style.fontFamily,
        fontSize: style.messageFontSize,
      },
    });
    this.spinButton = new Button(spinButtonStyle(style), texts.spin);
    this.betDown = new Button(betButtonStyle(style), '-');
    this.betUp = new Button(betButtonStyle(style), '+');
    this.addNodes(context, style.betButtons.offset);
    const presenter = new HudPresenter({ ...dependencies, texts }, (view) => {
      this.render(view);
    });
    this.connectInput(presenter);
  }

  /** Buttons and keys only report presses; the presenter decides what they do. */
  private connectInput(presenter: HudPresenter): void {
    this.spinButton.onPress(() => {
      presenter.pressSpin();
    });
    this.betDown.onPress(() => {
      presenter.changeBet(-1);
    });
    this.betUp.onPress(() => {
      presenter.changeBet(1);
    });
    window.addEventListener('keydown', (event) => {
      // A held key repeats: one press is one Spin, not a new round every few frames.
      if (!spinKeys.has(event.code) || event.repeat) {
        return;
      }
      event.preventDefault();
      presenter.pressSpin();
    });
  }

  private addNodes(
    { layers, layout }: Pick<GameContext, 'layers' | 'layout'>,
    betButtonOffset: number,
  ): void {
    this.betDown.view.x = -betButtonOffset;
    this.betUp.view.x = betButtonOffset;
    const betGroup = new Container();
    betGroup.addChild(this.bet.view, this.betDown.view, this.betUp.view);
    const nodes: Record<HudNodeName, Container> = {
      spinButton: this.spinButton.view,
      balance: this.balance.view,
      bet: betGroup,
      win: this.win.view,
      message: this.message,
    };
    for (const name of hudNodeNames) {
      layers.hud.addChild(nodes[name]);
      layout.addNode(name, nodes[name]);
    }
  }

  private render(view: HudView): void {
    this.balance.setValue(view.balance);
    this.bet.setValue(view.bet);
    this.win.setValue(view.win);
    this.message.text = view.message;
    this.spinButton.setText(view.spinLabel);
    this.spinButton.setEnabled(view.spinEnabled);
    this.betDown.setEnabled(view.betDownEnabled);
    this.betUp.setEnabled(view.betUpEnabled);
  }
}

function spinButtonStyle(style: HudStyle): ButtonStyle {
  const { radius, fontSize } = style.spinButton;
  return { ...buttonColors(style), shape: { radius }, fontSize };
}

function betButtonStyle(style: HudStyle): ButtonStyle {
  const { size, fontSize } = style.betButtons;
  return { ...buttonColors(style), shape: { width: size, height: size }, fontSize };
}

function buttonColors(style: HudStyle): Omit<ButtonStyle, 'shape' | 'fontSize'> {
  return {
    color: style.buttonColor,
    textColor: style.buttonTextColor,
    fontFamily: style.fontFamily,
  };
}
