// Plays many rounds of Octo Vault without a browser and prints RTP and frequencies.
//
//   npm run simulate                                # 200 000 spins, 20 000 bonus buys, seed 1
//   npm run simulate -- --spins 1000000 --seed 7
//
// The game math is TypeScript that imports `slot-sdk`, so Vite loads it the same way it does
// for the game: no build step and no second copy of the rules.
import { parseArgs } from 'node:util';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';

const { values } = parseArgs({
  options: {
    spins: { type: 'string', default: '200000' },
    bonus: { type: 'string', default: '20000' },
    seed: { type: 'string', default: '1' },
    bet: { type: 'string', default: '100' },
  },
});
const [spins, bonus, seed, bet] = [values.spins, values.bonus, values.seed, values.bet].map(Number);

const server = await createServer({
  root: fileURLToPath(new URL('..', import.meta.url)),
  server: { middlewareMode: true, hmr: false },
  appType: 'custom',
  logLevel: 'error',
});
try {
  const { simulateSpins, simulateBonusBuys } = await server.ssrLoadModule(
    '/src/simulation/simulate.ts',
  );
  const { formatReport } = await server.ssrLoadModule('/src/simulation/report.ts');
  const started = performance.now();
  const report = formatReport(
    simulateSpins(spins, bet, seed),
    simulateBonusBuys(bonus, bet, seed + 1),
  );
  console.log(`Seed ${String(seed)}, bet ${String(bet)}\n\n${report}`);
  console.log(`\n${((performance.now() - started) / 1000).toFixed(1)} s`);
} finally {
  await server.close();
}
