/** The part of a page that hears gestures. `window` in the browser. */
export type GestureTarget = Pick<Window, 'addEventListener' | 'removeEventListener'>;

const gestures = ['pointerdown', 'keydown'] as const;

/**
 * Resumes `context` on the player's first gesture and then stops listening. Browsers start audio
 * only after a gesture; `@pixi/sound` itself unlocks on `mousedown` and `touchend` only, while Spin
 * can also be the first key press, and a pen or a browser that drops mouse events still sends
 * `pointerdown`. A gesture that does not get the context running leaves the listeners for the next.
 */
export function unlockAudioOnGesture(
  context: Pick<AudioContext, 'state' | 'resume'>,
  target: GestureTarget,
): void {
  const stopListening = (): void => {
    for (const gesture of gestures) {
      target.removeEventListener(gesture, unlock);
    }
  };
  const unlock = (): void => {
    if (context.state !== 'suspended') {
      stopListening();
      return;
    }
    void context.resume().then(() => {
      if (context.state === 'running') {
        stopListening();
      }
    });
  };
  for (const gesture of gestures) {
    target.addEventListener(gesture, unlock);
  }
}
