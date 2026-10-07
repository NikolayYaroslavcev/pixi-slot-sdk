# Pirate's Fortune on pixi-slot-sdk

[Русский](README.md) · **English**

A 5×4 video slot and the SDK it is built on. The SDK lives in `packages/slot-sdk` and handles the
shared parts: loading, screen layout, reels, the round and win presentation. The game lives in
`games/octo-vault` (players see it as Pirate's Fortune) and adds its own symbols, math and an
octopus captain. A new game can be created from a template with one command.

- Repository: https://github.com/NikolayYaroslavcev/pixi-slot-sdk
- Play: https://nikolayyaroslavcev.github.io/pixi-slot-sdk/

Stack: TypeScript (strict), PixiJS 8, `@pixi/sound`, Vite, Vitest, ESLint, Prettier, npm workspaces.
Requires Node.js 24 (version in `.nvmrc`).

## Running

```sh
npm install
npm run dev          # http://localhost:5173
npm run build        # builds to games/octo-vault/dist
npm run preview      # http://localhost:4173
npm run test
npm run lint
npm run typecheck
npm run simulate     # 200,000 rounds without a browser, prints RTP
```

Root scripts run Pirate's Fortune. To run another game, use its workspace:
`npm run dev -w games/<name>`. A push to `main` builds the game and deploys it to GitHub Pages.

## Rules

- 5×4 grid, 15 lines.
- Bet per spin: 0.10 to 10.00. Starting balance 1,000.00.
- A line pays for 3, 4 or 5 matching symbols in a row, starting from the leftmost reel.
- Wild (the red octopus) lands on reels 2, 3 and 4 and substitutes for everything except Scatter.
- Grab: before lines are counted, each octopus throws 2 to 4 tentacles, and grabbed cells become
  Wilds with a ×2, ×3 or ×5 multiplier. Wild multipliers on the same line add up.
- Scatter (chest): 3, 4 or 5 of them give 8, 10 or 12 free spins. During free spins, Wilds stay in
  place until the series ends.
- The bonus can be bought: 10 free spins for 88× the bet.
- A win of 10× the bet or more shows Big Win, 25× or more shows Mega Win.

| Symbol  | 3   | 4   | 5   |
| ------- | --- | --- | --- |
| Compass | 1.5 | 5   | 15  |
| Map     | 1   | 3   | 8   |
| Anchor  | 0.8 | 2   | 6   |
| Rum     | 0.5 | 1.5 | 4   |
| A, K    | 0.3 | 0.8 | 2   |
| Q, J    | 0.2 | 0.5 | 1.5 |

Payouts are in bets. The **i** button in the game shows the same table for the current bet.

Spin with the Spin button, Space or Enter. While the reels spin, the same button stops them, and
while a win is shown it skips the animation.

Reel strips are tuned for an RTP of about 96%. Simulating 3 million spins gives 97.9%.

## Debugging

A mock replaces the server (`games/octo-vault/src/mock`). URL parameters change how it behaves:

| Parameter            | What it does                                        |
| -------------------- | --------------------------------------------------- |
| `?seed=7`            | Repeats the same rounds. The session seed is logged |
| `?scenario=<name>`   | Every spin stops on the given grid                  |
| `?scenario=playlist` | Plays the main scenarios in turn                    |
| `?scenario=error`    | Every round fails, the bet is refunded              |
| `?debug=layout`      | Draws bounds and anchor points of layout elements   |

Scenarios: `nowin`, `win`, `multiwin`, `wild`, `tentacles`, `scatter`, `freespins4`, `freespins5`,
`bigwin`, `megawin`, `error`, `playlist`. Parameters can be combined, for example
`?scenario=tentacles&seed=3`.

## How it works

```
games/octo-vault ─┐
templates/game  ──┼──▶  slot-sdk  ──▶  pixi.js, @pixi/sound
games/<new>     ──┘
```

A game imports only `slot-sdk`, and the SDK knows nothing about games. ESLint enforces this.

```
packages/slot-sdk/src/
  core/       game startup, context, event bus, Feature
  ecs/        World, components, systems (no Pixi)
  flow/       state machine and round player (no Pixi)
  math/       round contract, money, seeded Rng (no Pixi)
  reels/      reels: model, spinning, rendering
  wins/       line highlights, Big Win
  layout/     landscape and portrait layout
  assets/     manifest, loading, loading screen
  ui/         buttons, HUD, popup
  audio/      sound
  character/  animated character
  anim/       tween and easing
games/octo-vault/src/
  config/     symbols, payouts, lines, reel strips, timings
  math/       line evaluation, Grab, free spins (no Pixi)
  mock/       stand-in server
  features/   game mechanics
  scene/      background, logo, reel frame
templates/game/   minimal 3×3 game that new games are copied from
```

The server (here, the mock) computes the whole round and returns it as a list of steps. The client
just plays them in order:

```ts
[
  { type: 'reveal', grid },                               // stop the reels on this grid
  { type: 'tentacles', grabs: [{ from, hits: [...] }] },  // game step: Grab
  { type: 'wins', wins, amount: 450 },                    // show lines
  { type: 'totalWin', amount: 450 },                      // round total
]
```

Each step type has a handler. To add a mechanic, a game adds a new step type and a `Feature` that
registers a handler for it. The SDK does not change: it has no mention of tentacles or free spins.
Example: `games/octo-vault/src/features/tentacleGrab/tentacleGrab.ts`.

`ecs`, `flow` and `math` do not depend on Pixi, so they are tested in plain Node, and the game math
runs in `npm run simulate`.

Money is stored as integer minor units. The math uses a seeded Rng instead of `Math.random()`.

## New game

```sh
npm run create-game treasure-hunt
npm run dev -w games/treasure-hunt
```

The command copies `templates/game` into `games/treasure-hunt`. The result is a working 3×3 game
with placeholder symbols. Then:

1. Define symbols in `src/config/symbols.ts`, their look in `src/assets.ts`, reel strips in
   `src/config/reels.config.ts`.
2. Place elements in `src/layout.ts`, separately for landscape and portrait.
3. Round results come from `src/mock/MockResultSource.ts`. It can be replaced with a real server
   client.
4. Mechanics are added as `Feature`s in `src/main.ts`.

More on the template files: [templates/game/README.md](templates/game/README.md).

## Assets and screen

Game files live in `public/assets/`, and `src/assets.ts` lists them with aliases. A symbol without
art is a compile error. If a file fails to load, the player sees a Retry button.

Pirate's Fortune art (symbols, frame, sounds) is generated by scripts in
`games/octo-vault/scripts/`. Sources and licenses: [CREDITS.md](CREDITS.md).

The game fits screens from 320 px wide up to ultrawide monitors and switches layout when a phone is
rotated. It keeps clear of the notch and other unsafe areas.

## Tests

452 unit tests cover the logic: ECS, state machine and round, reels, layout, money, game math, the
mock and `create-game`. CI runs lint, typecheck, tests and the build, then creates a game from the
template and checks it the same way.
