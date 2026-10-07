import type { SoundLibrary } from '@pixi/sound';

/** The part of the `@pixi/sound` library the game audio uses. Tests pass a fake. */
export type SoundBackend = Pick<
  SoundLibrary,
  'exists' | 'play' | 'stop' | 'muteAll' | 'unmuteAll' | 'pauseAll' | 'resumeAll'
>;

/** The page: hidden or not. `document` in the browser. */
export type AudioPage = Pick<Document, 'hidden' | 'addEventListener'>;

/** How `GameAudio.play` plays one sound. */
export interface PlayOptions {
  /** Relative to the sound's own level, from 0 to 1. Defaults to 1. */
  volume?: number;
  /** Plays again from the start when it ends, e.g. music. */
  loop?: boolean;
}

/** Where the mute choice of the player is kept between visits. */
const mutedKey = 'slot-sdk.muted';

/**
 * Sounds of the game, loaded from the manifest like any other file: `play('reelStop')`
 * plays the entry with that alias. Sound never decides anything in the game: a missing
 * sound plays nothing, and the game runs the same muted or not.
 *
 * - Mute is remembered in the browser storage and covers every sound, music included.
 * - On a hidden tab everything pauses; it continues when the tab is back.
 * - Browsers start audio only after the first click, tap or key. Before that, sounds are
 *   simply silent (`@pixi/sound` unlocks on the first click or tap, `SlotGame` on a key).
 */
export class GameAudio {
  private mutedNow: boolean;

  constructor(
    private readonly backend: SoundBackend,
    page: AudioPage,
    private readonly storage: Pick<Storage, 'getItem' | 'setItem'> | null,
  ) {
    this.mutedNow = readStored(storage) === 'true';
    if (this.mutedNow) {
      backend.muteAll();
    }
    page.addEventListener('visibilitychange', () => {
      if (page.hidden) {
        backend.pauseAll();
      } else {
        backend.resumeAll();
      }
    });
  }

  get muted(): boolean {
    return this.mutedNow;
  }

  setMuted(muted: boolean): void {
    this.mutedNow = muted;
    if (muted) {
      this.backend.muteAll();
    } else {
      this.backend.unmuteAll();
    }
    try {
      this.storage?.setItem(mutedKey, String(muted));
    } catch {
      // Storage may be blocked (private mode): the choice then lasts until the page closes.
    }
  }

  /** Plays the sound with this alias from the manifest. Nothing happens if there is none. */
  play(alias: string, options: PlayOptions = {}): void {
    if (!this.backend.exists(alias)) {
      return;
    }
    void this.backend.play(alias, options);
  }

  /** Stops every instance of the sound, e.g. a jingle cut short by Skip. */
  stop(alias: string): void {
    if (this.backend.exists(alias)) {
      this.backend.stop(alias);
    }
  }
}

function readStored(storage: Pick<Storage, 'getItem'> | null): string | null {
  try {
    return storage?.getItem(mutedKey) ?? null;
  } catch {
    return null;
  }
}
