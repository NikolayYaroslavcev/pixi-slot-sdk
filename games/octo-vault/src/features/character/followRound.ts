import type { EventBus, GameEvents } from 'slot-sdk';
import type { CharacterDirector } from './CharacterDirector';

/** Which call of the director answers each event of the round. */
const directorCallOf = {
  spinStarted: 'spinStarted',
  reelAnticipated: 'anticipationStarted',
  spinCompleted: 'spinCompleted',
  tentacleThrown: 'grab',
  winsShown: 'win',
  bigWinShown: 'bigWinShown',
  bigWinEnded: 'bigWinEnded',
} as const satisfies Partial<Record<keyof GameEvents, keyof CharacterDirector>>;

export type FollowingDirector = Pick<
  CharacterDirector,
  (typeof directorCallOf)[keyof typeof directorCallOf] | 'roundIdle'
>;

/**
 * Lets the director hear the round: one listener per event, nothing else. Returns the way to
 * stop listening, which takes every one of them away.
 */
export function followRound(events: EventBus<GameEvents>, director: FollowingDirector): () => void {
  const calls = Object.entries(directorCallOf).map(
    ([event, call]) =>
      [
        event as keyof typeof directorCallOf,
        () => {
          director[call]();
        },
      ] as const,
  );
  const onRoundState = (state: GameEvents['roundStateChanged']): void => {
    if (state === 'idle') {
      director.roundIdle();
    }
  };
  for (const [event, listener] of calls) {
    events.on(event, listener);
  }
  events.on('roundStateChanged', onRoundState);
  return () => {
    for (const [event, listener] of calls) {
      events.off(event, listener);
    }
    events.off('roundStateChanged', onRoundState);
  };
}
