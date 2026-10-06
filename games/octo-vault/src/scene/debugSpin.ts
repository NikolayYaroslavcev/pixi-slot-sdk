import { wait, type GameContext, type ReelGrid, type ReelMotionSystem } from 'slot-sdk';
import type { SymbolId } from '../config/symbols';

// Temporary until the HUD of stage 8 and the round flow of stage 7.

/** Fixed fields to stop on, used in turn. They include repeated and special symbols on purpose. */
const targets: readonly (readonly (readonly SymbolId[])[])[] = [
  [
    ['key', 'shell', 'shell', 'shell'],
    ['pearl', 'octopus', 'octopus', 'pearl'],
    ['crown', 'crown', 'crown', 'crown'],
    ['fish', 'key', 'anchor', 'fish'],
    ['chest', 'seahorse', 'starfish', 'key'],
  ],
  [
    ['starfish', 'anchor', 'fish', 'pearl'],
    ['shell', 'seahorse', 'chest', 'crown'],
    ['octopus', 'fish', 'key', 'shell'],
    ['pearl', 'pearl', 'seahorse', 'starfish'],
    ['anchor', 'crown', 'shell', 'fish'],
  ],
  [
    ['shell', 'pearl', 'starfish', 'key'],
    ['anchor', 'octopus', 'fish', 'seahorse'],
    ['crown', 'chest', 'shell', 'pearl'],
    ['starfish', 'key', 'octopus', 'anchor'],
    ['fish', 'seahorse', 'crown', 'chest'],
  ],
];

/** A long spin keeps the reels at full speed this long before they are told to stop. */
const longSpinMs = 4000;

/**
 * Space or a tap on the field spins the reels, L spins them long.
 * After each spin the console says whether the field matches the target.
 */
export function connectDebugSpin(
  context: GameContext,
  grid: ReelGrid<SymbolId>,
  spinner: ReelMotionSystem<SymbolId>,
): void {
  let spinCount = 0;
  const spin = async (delayMs: number): Promise<void> => {
    if (spinner.isSpinning) {
      return;
    }
    const target = targets[spinCount % targets.length] ?? [];
    spinCount += 1;
    spinner.start();
    await wait(context.app.ticker, delayMs);
    await spinner.stop(target);
    reportField(grid, target);
  };
  window.addEventListener('keydown', (event) => {
    if (event.code === 'Space' || event.code === 'KeyL') {
      void spin(event.code === 'KeyL' ? longSpinMs : 0);
    }
  });
  const field = context.layers.reels;
  field.eventMode = 'static';
  field.cursor = 'pointer';
  field.on('pointertap', () => void spin(0));
}

function reportField(grid: ReelGrid<SymbolId>, target: readonly (readonly SymbolId[])[]): void {
  const mismatches = grid.visibleCells.filter(
    (cell) => grid.symbolAt(cell) !== target[cell.reelIndex]?.[cell.rowIndex],
  );
  if (mismatches.length > 0) {
    console.error('[debug spin] field does not match the target', mismatches);
    return;
  }
  console.info('[debug spin] field matches the target');
}
