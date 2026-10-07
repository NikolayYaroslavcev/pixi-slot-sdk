import type { Feature, GameContext, GameEvents, PlayOptions } from 'slot-sdk';
import { soundLevels, type SoundName } from '../../config/sound.config';
import { isScatter } from '../../config/symbols';
import type { FieldParts, ReelsFeature } from '../../scene/reels';

/** Events whose sound is always the same. */
const soundOfEvent = {
  buttonPressed: 'click',
  spinStarted: 'spinStart',
  tentacleThrown: 'tentacle',
  multiplierLanded: 'multiplier',
  winsShown: 'win',
  bigWinShown: 'bigWin',
  reelAnticipated: 'anticipation',
} as const satisfies Partial<Record<keyof GameEvents, SoundName>>;

/**
 * Sounds of Octo Vault and the mute button. Every sound answers an event the game already
 * sends, so no mechanic knows about audio. Mute, the unlock on the first gesture and the
 * silence on a hidden tab belong to the SDK's `GameAudio`.
 */
export function sound(reels: ReelsFeature): Feature {
  return {
    install(context) {
      const play = (name: SoundName, options: PlayOptions = {}): void => {
        context.audio.play(name, { volume: soundLevels[name], ...options });
      };
      addMuteButton(context);
      playOnEvents(context, reels.parts, play);
      // Browsers hold it until the first gesture; then it starts by itself.
      play('music', { loop: true });
    },
  };
}

function addMuteButton(context: GameContext): void {
  const { audio } = context;
  const icon = (): string => (audio.muted ? 'soundOffIcon' : 'soundOnIcon');
  const button = context.hud.addIconButton('sound', icon());
  button.onPress(() => {
    audio.setMuted(!audio.muted);
    button.setIcon(icon());
  });
}

function playOnEvents(
  context: GameContext,
  field: FieldParts,
  play: (name: SoundName) => void,
): void {
  const { events } = context;
  for (const [event, name] of Object.entries(soundOfEvent)) {
    events.on(event as keyof typeof soundOfEvent, () => {
      play(name);
    });
  }
  events.on('reelStopped', ({ reelIndex }) => {
    play(reelHasScatter(field, reelIndex) ? 'scatterLand' : 'reelStop');
  });
  // Skip cuts the jingle together with the overlay.
  events.on('bigWinEnded', () => {
    context.audio.stop('bigWin');
  });
  events.on('freeSpinsActive', (active) => {
    if (active) {
      play('freeSpins');
    }
  });
}

function reelHasScatter(field: FieldParts, reelIndex: number): boolean {
  return field.grid.columns[reelIndex]?.some((symbolId) => isScatter(symbolId)) ?? false;
}
