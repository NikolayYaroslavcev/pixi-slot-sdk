import { describe, expect, it } from 'vitest';
import { paylines } from './paylines';
import { paytable, wildPaysAs } from './paytable';
import { reelsConfig } from './reels.config';
import { isRegularSymbol, symbols, type SymbolId } from './symbols';

const { reelCount, rowCount } = reelsConfig.size;

describe('Octo Vault paylines', () => {
  it('has 15 different lines across the whole field', () => {
    expect(paylines).toHaveLength(15);
    expect(new Set(paylines.map((line) => line.join())).size).toBe(15);
    for (const line of paylines) {
      expect(line).toHaveLength(reelCount);
      expect(line.every((rowIndex) => rowIndex >= 0 && rowIndex < rowCount)).toBe(true);
    }
  });
});

describe('Octo Vault paytable', () => {
  it('pays every regular symbol and neither the Wild nor the Scatter', () => {
    const regular = (Object.keys(symbols) as SymbolId[]).filter(isRegularSymbol);

    expect(Object.keys(paytable).sort()).toEqual(regular.sort());
    expect(isRegularSymbol(wildPaysAs)).toBe(true);
  });

  it('pays more for longer combinations and higher symbols pay more than lower ones', () => {
    for (const pays of Object.values(paytable)) {
      expect(pays[3]).toBeGreaterThan(0);
      expect(pays[4]).toBeGreaterThan(pays[3]);
      expect(pays[5]).toBeGreaterThan(pays[4]);
    }
    const lowTop = Math.max(
      paytable.jack[5],
      paytable.queen[5],
      paytable.king[5],
      paytable.ace[5],
    );
    const highBottom = Math.min(
      paytable.bottle[5],
      paytable.anchor[5],
      paytable.turtle[5],
      paytable.shark[5],
    );
    expect(highBottom).toBeGreaterThan(lowTop);
  });
});
