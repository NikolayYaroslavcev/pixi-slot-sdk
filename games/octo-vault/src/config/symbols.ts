/** Role of a symbol in the rules. Payouts and mechanics are tied to the role, not to the art. */
export type SymbolTier = 'low' | 'high' | 'wild' | 'scatter';

/**
 * Every symbol of Octo Vault. The keys are the only list of symbol ids in the game:
 * `SymbolId` is derived from them, and the asset manifest, the reels and later
 * the paytable are checked against it.
 */
export const symbols = {
  shell: { tier: 'low' },
  starfish: { tier: 'low' },
  seahorse: { tier: 'low' },
  fish: { tier: 'low' },
  pearl: { tier: 'high' },
  anchor: { tier: 'high' },
  chest: { tier: 'high' },
  crown: { tier: 'high' },
  octopus: { tier: 'wild' },
  key: { tier: 'scatter' },
} as const satisfies Record<string, { tier: SymbolTier }>;

export type SymbolId = keyof typeof symbols;
