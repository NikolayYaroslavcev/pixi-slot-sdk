import type { ColorSource } from 'pixi.js';

/** One file to load. */
export interface AssetEntry {
  /** Name the game uses for the file, unique across both bundles. */
  alias: string;
  /** Path relative to the page, e.g. `assets/logo.svg` for a file in the game's `public/assets/`. */
  src: string;
  /** Required for a font file: the name to put in `fontFamily` of a text style. */
  family?: string;
}

/** Temporary look of a symbol until its art exists: a colored tile with a label. */
export interface SymbolPlaceholder {
  color: ColorSource;
  label: string;
}

/**
 * Every resource of a game. Adding a file is one entry in `preload` or `game`.
 *
 * `SymbolId` is the union of the game's symbol ids. With it, a symbol missing from
 * `symbols` is a compile error: `export const assets = { ... } satisfies AssetManifest<SymbolId>`.
 */
export interface AssetManifest<SymbolId extends string = string> {
  /** What the loading screen itself shows, e.g. the logo. Loaded first, kept small. */
  preload: readonly AssetEntry[];
  /** Everything else. The progress bar follows this bundle. */
  game: readonly AssetEntry[];
  /** Placeholder art of every symbol, drawn after `game` has loaded. */
  symbols: Readonly<Record<SymbolId, SymbolPlaceholder>>;
}

const FONT_FILE = /\.(woff2?|ttf|otf)$/i;

/** Runtime checks for what the type system cannot see. Each problem is one readable line. */
export function findManifestProblems(manifest: AssetManifest): string[] {
  const problems: string[] = [];
  const seenAliases = new Set<string>();
  const entries = [
    ...manifest.preload.map((entry, index) => ({
      entry,
      path: `assets.preload[${String(index)}]`,
    })),
    ...manifest.game.map((entry, index) => ({ entry, path: `assets.game[${String(index)}]` })),
  ];
  for (const { entry, path } of entries) {
    problems.push(...findEntryProblems(entry, path, seenAliases));
    seenAliases.add(entry.alias);
  }
  if (Object.keys(manifest.symbols).length === 0) {
    problems.push('assets.symbols must describe at least one symbol');
  }
  return problems;
}

function findEntryProblems(entry: AssetEntry, path: string, seenAliases: Set<string>): string[] {
  const problems: string[] = [];
  if (entry.alias === '') {
    problems.push(`${path}.alias must not be empty`);
  }
  if (seenAliases.has(entry.alias)) {
    problems.push(`${path}.alias "${entry.alias}" is already used by another entry`);
  }
  if (entry.src === '') {
    problems.push(`${path}.src must not be empty`);
  }
  if (FONT_FILE.test(entry.src) && !entry.family) {
    problems.push(`${path} is a font file, set its family (the name used in text styles)`);
  }
  return problems;
}
