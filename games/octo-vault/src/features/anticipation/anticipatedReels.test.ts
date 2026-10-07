import { describe, expect, it } from 'vitest';
import { anticipatedReels } from './anticipatedReels';

const isKey = (symbolId: string): boolean => symbolId === 'K';

describe('anticipatedReels', () => {
  it('holds every reel after the one where the second Scatter lands', () => {
    const columns = [
      ['K', 'a'],
      ['b', 'b'],
      ['a', 'K'],
      ['a', 'a'],
      ['b', 'a'],
    ];
    expect(anticipatedReels(columns, isKey, 2)).toEqual([3, 4]);
  });

  it('counts two Scatters on one reel', () => {
    const columns = [
      ['K', 'K'],
      ['b', 'b'],
      ['a', 'a'],
    ];
    expect(anticipatedReels(columns, isKey, 2)).toEqual([1, 2]);
  });

  it('holds nothing with fewer Scatters, or when the last reel completes them', () => {
    expect(anticipatedReels([['K'], ['a'], ['b']], isKey, 2)).toEqual([]);
    expect(anticipatedReels([['K'], ['a'], ['K']], isKey, 2)).toEqual([]);
  });
});
