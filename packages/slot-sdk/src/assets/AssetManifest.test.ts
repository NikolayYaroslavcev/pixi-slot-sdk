import { describe, expect, it } from 'vitest';
import { findManifestProblems, type AssetManifest } from './AssetManifest';

function createManifest(overrides: Partial<AssetManifest> = {}): AssetManifest {
  return {
    preload: [{ alias: 'logo', src: 'assets/logo.svg' }],
    game: [{ alias: 'title', src: 'assets/fonts/Title.woff2', family: 'Title' }],
    symbols: { low: { color: '#3366cc', label: 'Low' } },
    ...overrides,
  };
}

describe('findManifestProblems', () => {
  it('accepts a valid manifest', () => {
    expect(findManifestProblems(createManifest())).toEqual([]);
  });

  it('rejects an alias used in both bundles', () => {
    const manifest = createManifest({ game: [{ alias: 'logo', src: 'assets/other.png' }] });

    expect(findManifestProblems(manifest)).toEqual([
      'assets.game[0].alias "logo" is already used by another entry',
    ]);
  });

  it('rejects an empty alias and src', () => {
    const manifest = createManifest({ preload: [{ alias: '', src: '' }] });

    expect(findManifestProblems(manifest)).toEqual([
      'assets.preload[0].alias must not be empty',
      'assets.preload[0].src must not be empty',
    ]);
  });

  it('asks for the family of a font file', () => {
    const manifest = createManifest({ game: [{ alias: 'body', src: 'assets/fonts/Body.ttf' }] });

    expect(findManifestProblems(manifest)).toEqual([
      'assets.game[0] is a font file, set its family (the name used in text styles)',
    ]);
  });

  it('rejects a manifest without symbols', () => {
    expect(findManifestProblems(createManifest({ symbols: {} }))).toEqual([
      'assets.symbols must describe at least one symbol',
    ]);
  });

  it('makes a symbol without art a compile error once SymbolId is known', () => {
    type SymbolId = 'low' | 'high';
    const manifest = {
      preload: [],
      game: [],
      // @ts-expect-error: 'high' has no placeholder
      symbols: { low: { color: '#3366cc', label: 'Low' } },
    } satisfies AssetManifest<SymbolId>;

    expect(manifest.symbols.low.label).toBe('Low');
  });
});
