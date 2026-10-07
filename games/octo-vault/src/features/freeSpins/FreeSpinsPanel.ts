import { Container } from 'pixi.js';
import { formatMoney, LabeledValue, type LabeledValueStyle } from 'slot-sdk';

/** What the panel shows: the feature state of a running series. */
export interface FreeSpinsProgress {
  /** Number of the current free spin, from 1; 0 before the first one. */
  readonly spin: number;
  readonly count: number;
  /** Won in the series so far, minor units. */
  readonly seriesWin: number;
}

export interface FreeSpinsPanelLook extends LabeledValueStyle {
  /** Captions above the counter and the series win. */
  spinsCaption: string;
  winCaption: string;
}

/**
 * The counter of a running series, "FREE SPINS 3 / 8", and the series win. Hidden outside
 * free spins. They are two layout nodes, so each variant places them where there is room.
 * The layout owns the visibility of a node, so the panel shows and hides what is inside them.
 */
export class FreeSpinsPanel {
  private readonly spins: LabeledValue;
  private readonly win: LabeledValue;
  private readonly countNode = new Container({ label: 'freeSpinsCount' });
  private readonly winNode = new Container({ label: 'freeSpinsWin' });

  constructor(look: FreeSpinsPanelLook) {
    this.spins = new LabeledValue(look.spinsCaption, look);
    this.win = new LabeledValue(look.winCaption, look);
    this.countNode.addChild(this.spins.view);
    this.winNode.addChild(this.win.view);
    this.hide();
  }

  get nodes(): { freeSpinsCount: Container; freeSpinsWin: Container } {
    return { freeSpinsCount: this.countNode, freeSpinsWin: this.winNode };
  }

  show(progress: FreeSpinsProgress): void {
    this.spins.setValue(`${String(progress.spin)} / ${String(progress.count)}`);
    this.win.setValue(formatMoney(progress.seriesWin));
    this.spins.view.visible = true;
    this.win.view.visible = true;
  }

  hide(): void {
    this.spins.view.visible = false;
    this.win.view.visible = false;
  }
}
