import { Text, type ColorSource, type Container } from 'pixi.js';
import type { ButtonStyle } from './buttonLook';

/** Look of a popup. Sizes are design pixels. */
export interface PopupStyle {
  width: number;
  padding: number;
  panelColor: ColorSource;
  /** Texture of the panel from the manifest, stretched in its middle. Without it: a plain panel. */
  panelSkin?: string;
  /** Covers the screen behind the popup, so the game below reads as paused. */
  dimColor: ColorSource;
  dimAlpha: number;
  titleColor: ColorSource;
  titleFontSize: number;
  /** Font of the title, if it differs from the buttons'. */
  titleFontFamily?: string;
  messageColor: ColorSource;
  messageFontSize: number;
  /** Buttons of the popup, side by side under the message. */
  button: Omit<ButtonStyle, 'shape'> & { width: number; height: number };
  /** The first button is the main choice; it may look different, e.g. brighter. */
  mainButton?: Pick<ButtonStyle, 'skin' | 'textColor'>;
}

/** What a popup asks. Each button closes it with its `value`. */
export interface PopupContent {
  title: string;
  message: string;
  /** Shown between the message and the buttons, e.g. a paytable. The popup does not destroy it. */
  body?: Container;
  buttons: readonly { label: string; value: string }[];
}

/** A centered text that grows down from its top and wraps inside the panel. */
export function createPopupText(
  style: PopupStyle,
  fontFamily: string,
  fill: ColorSource,
  fontSize: number,
): Text {
  return new Text({
    anchor: { x: 0.5, y: 0 },
    style: {
      fill,
      fontSize,
      fontFamily,
      align: 'center',
      wordWrap: true,
      wordWrapWidth: style.width - style.padding * 2,
    },
  });
}
