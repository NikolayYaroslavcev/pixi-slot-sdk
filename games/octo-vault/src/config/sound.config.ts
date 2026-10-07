/**
 * Levels of the game's sounds, from 0 to 1 of each file's own level. The files are synthesized by
 * `scripts/make-sounds.mjs`. Clicks and stops are frequent, so they stay quiet; the shanty plays
 * for the whole session, so it sits well under everything else.
 */
export const soundLevels = {
  music: 0.22,
  click: 0.35,
  spinStart: 0.4,
  reelStop: 0.45,
  scatterLand: 0.7,
  anticipation: 0.6,
  tentacle: 0.55,
  multiplier: 0.6,
  win: 0.55,
  bigWin: 0.8,
  freeSpins: 0.7,
} as const;

export type SoundName = keyof typeof soundLevels;
