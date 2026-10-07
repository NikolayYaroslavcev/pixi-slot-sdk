import { Container, Text } from 'pixi.js';
import type { GameContext } from '../core/GameContext';
import { Button, type ButtonStyle } from './Button';
import { HudPresenter, type HudPresenterDependencies, type HudView } from './HudPresenter';
import {
  hudButtonStyle,
  hudNodeNames,
  type ButtonArt,
  type HudNodeName,
  type HudStyle,
} from './HudStyle';
import { LabeledValue } from './LabeledValue';
import type { Popup } from './Popup';
import { listenForSpinKeys } from './spinKeys';

export { hudNodeNames, type HudNodeName, type HudStyle, type SpinButtonLooks } from './HudStyle';

/** The part of the HUD that features see. */
export interface HudControls {
  /**
   * Adds a button in the look of the HUD, e.g. to buy a feature. The layout places it as the node
   * `nodeName`, which the game's `layout.ts` describes. The feature decides what it does
   * and when it is enabled.
   */
  addButton(nodeName: string, label: string): Button;
  /** Adds a small round button showing the texture `icon` from the manifest, e.g. sound on/off. */
  addIconButton(nodeName: string, icon: string): Button;
}

type HudContext = Pick<GameContext, 'app' | 'layers' | 'layout' | 'events'> & { popup: Popup };

/**
 * Balance, bet with − / +, win, a message line and the Spin / Stop / Skip button.
 * A plain class, not ECS. It draws what `HudPresenter` decides and passes presses back to it.
 * Keys do nothing while a popup is open: the popup has the player's attention.
 */
export class Hud implements HudControls {
  private readonly balance: LabeledValue;
  private readonly win: LabeledValue;
  private readonly bet: LabeledValue;
  private readonly message: Text;
  private readonly spinButton: Button;
  private readonly betDown: Button;
  private readonly betUp: Button;
  private shownBet = '';

  constructor(
    private readonly context: HudContext,
    dependencies: Omit<HudPresenterDependencies, 'texts'>,
    private readonly style: HudStyle,
  ) {
    const { texts } = style;
    const valueStyle = { ...style, valueColor: style.textColor };
    this.balance = new LabeledValue(texts.balance, valueStyle);
    this.win = new LabeledValue(texts.win, valueStyle);
    this.bet = new LabeledValue(texts.bet, valueStyle);
    this.message = createMessage(style);
    const { radius, fontSize } = style.spinButton;
    this.spinButton = this.button(style.spinButton, { radius }, fontSize, texts.spin);
    const { size, fontSize: betFontSize } = style.betButtons;
    const square = { width: size, height: size };
    this.betDown = this.button(style.betButtons, square, betFontSize, '-');
    this.betUp = this.button(style.betButtons, square, betFontSize, '+');
    this.addNodes(style.betButtons.offset);
    const presenter = new HudPresenter({ ...dependencies, texts }, (view) => {
      this.render(view);
    });
    this.connectInput(presenter);
  }

  addButton(nodeName: string, label: string): Button {
    const { width, height, fontSize } = this.style.extraButtons;
    const button = this.button(this.style.extraButtons, { width, height }, fontSize, label);
    this.place(nodeName, button);
    return button;
  }

  addIconButton(nodeName: string, icon: string): Button {
    const art = this.style.iconButtons ?? { radius: this.style.betButtons.size / 2 };
    const button = this.button(art, { radius: art.radius }, this.style.betButtons.fontSize, '');
    button.setIcon(icon);
    this.place(nodeName, button);
    return button;
  }

  /** A button in the HUD look. Every press is also announced, e.g. for a click sound. */
  private button(art: ButtonArt, shape: ButtonStyle['shape'], fontSize: number, label: string) {
    const style = hudButtonStyle(this.style, art, shape, fontSize);
    const button = new Button(style, label, this.context.app.ticker);
    button.onPress(() => {
      this.context.events.emit('buttonPressed', undefined);
    });
    return button;
  }

  private place(nodeName: string, button: Button): void {
    this.context.layers.hud.addChild(button.view);
    this.context.layout.addNode(nodeName, button.view);
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
    listenForSpinKeys(
      () => {
        presenter.pressSpin();
      },
      () => this.context.popup.isOpen,
    );
  }

  private addNodes(betButtonOffset: number): void {
    const { layers, layout } = this.context;
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
    this.win.setValue(view.win);
    this.renderBet(view.bet);
    this.message.text = view.message;
    this.renderSpinButton(view);
    this.betDown.setEnabled(view.betDownEnabled);
    this.betUp.setEnabled(view.betUpEnabled);
  }

  /** A new bet swells briefly, so the change reads even with the eyes on the reels. */
  private renderBet(bet: string): void {
    this.bet.setValue(bet);
    if (this.shownBet !== '' && this.shownBet !== bet) {
      this.bet.pulse(this.context.app.ticker);
    }
    this.shownBet = bet;
  }

  private renderSpinButton(view: HudView): void {
    const look = this.style.spinButton.looks?.[view.spinAction];
    if (look) {
      this.spinButton.setSkin(look.skin);
      this.spinButton.setIcon(look.icon);
    } else {
      this.spinButton.setText(view.spinLabel);
    }
    this.spinButton.setEnabled(view.spinEnabled);
  }
}

/** The message sits on the game's background, not on a panel: a soft shadow keeps it readable. */
function createMessage(style: HudStyle): Text {
  return new Text({
    anchor: 0.5,
    style: {
      fill: style.textColor,
      fontFamily: style.fontFamily,
      fontSize: style.messageFontSize,
      dropShadow: { color: '#000000', alpha: 0.85, blur: 6, distance: 3, angle: Math.PI / 2 },
    },
  });
}
