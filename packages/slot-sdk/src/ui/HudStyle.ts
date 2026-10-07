import type { ColorSource } from 'pixi.js';
import type { ButtonStyle } from './buttonLook';
import type { HudTexts, SpinAction } from './HudPresenter';
import type { ValuePanelStyle } from './LabeledValue';

/** Layout nodes of the HUD. Every game's `layout.ts` places each of them in both variants. */
export const hudNodeNames = ['spinButton', 'balance', 'bet', 'win', 'message'] as const;

export type HudNodeName = (typeof hudNodeNames)[number];

/** Art of the Spin button in each of its roles: a skin and an icon in place of the text. */
export type SpinButtonLooks = Record<SpinAction, { skin: string; icon: string }>;

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
  /** Without `looks` the button shows its text: SPIN, STOP or SKIP. */
  spinButton: ButtonArt & { radius: number; fontSize: number; looks?: SpinButtonLooks };
  /** The − and + buttons around the bet. `offset` is from the bet's center to theirs. */
  betButtons: ButtonArt & { size: number; fontSize: number; offset: number };
  /** Buttons a game adds with `context.hud.addButton`; `caption` styles their second line. */
  extraButtons: ButtonArt & {
    width: number;
    height: number;
    fontSize: number;
    caption?: ButtonStyle['caption'];
  };
  /** Small round buttons with a picture a game adds with `context.hud.addIconButton`. */
  iconButtons?: ButtonArt & { radius: number };
  /** Plate behind balance, bet and win. */
  valuePanel?: ValuePanelStyle;
  texts: HudTexts;
}

/** Optional art of a kind of button: a skin from the manifest and a larger touch area. */
export interface ButtonArt {
  skin?: string;
  hitPadding?: number;
  /** Label color on this kind of button, if it differs from `buttonTextColor`. */
  textColor?: ColorSource;
}

/** The style of one kind of HUD button: its own art over the HUD's colors and font. */
export function hudButtonStyle(
  style: HudStyle,
  art: ButtonArt & { caption?: ButtonStyle['caption'] },
  shape: ButtonStyle['shape'],
  fontSize: number,
): ButtonStyle {
  return {
    shape,
    fontSize,
    color: style.buttonColor,
    textColor: art.textColor ?? style.buttonTextColor,
    fontFamily: style.fontFamily,
    skin: art.skin,
    hitPadding: art.hitPadding,
    caption: art.caption,
  };
}
