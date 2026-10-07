# Pirate's Fortune on pixi-slot-sdk

[Русский](README.md) · **English**

A complete 5×4 video slot and the reusable SDK it is built on. The SDK (`packages/slot-sdk`) knows
how to load a game, lay it out, spin reels, play a round and show wins. The game
(`games/octo-vault`, shown to the player as **Pirate's Fortune**) adds the symbols, the math, the
octopus captain and its mechanics. A template and a CLI create the next game.

- Repository: https://github.com/NikolayYaroslavcev/pixi-slot-sdk
- Play online: https://nikolayyaroslavcev.github.io/pixi-slot-sdk/

Built with TypeScript 6 in strict mode, PixiJS 8 and `@pixi/sound` 6, bundled by Vite 8 and tested
with Vitest 5. ESLint 10 and Prettier 3 keep the style, npm workspaces hold the packages together.
Pixi and its sound library are the only runtime dependencies.

Node.js 24 LTS, pinned in `.nvmrc` and `engines`.

## Run

```sh
npm install          # once, from the repository root
npm run dev          # dev server for Pirate's Fortune, http://localhost:5173
npm run build        # production build in games/octo-vault/dist
npm run preview      # serve that build, http://localhost:4173
npm run test         # all unit tests (Vitest)
npm run lint         # ESLint and Prettier check
npm run typecheck    # tsc for the SDK and every game
npm run simulate     # play 200 000 rounds without a browser, print RTP
```

The root scripts run Pirate's Fortune. For another game, use its workspace:
`npm run dev -w games/<name>`. The build uses a relative `base`, so `dist/` works from any
sub-path.

Every push to `main` builds the game and publishes it to GitHub Pages
(`.github/workflows/deploy.yml`; in the repository settings, Pages → Source is GitHub Actions).

## Game rules

- **Field.** 5 reels × 4 rows, 15 fixed paylines.
- **Bet.** One total bet per spin: 0.10, 0.20, 0.50, 1.00, 2.00, 5.00 or 10.00. The session starts
  with a balance of 1,000.00. The bet is taken when the spin starts; the round's win is added when
  it ends.
- **Line wins.** A line pays for 3, 4 or 5 equal symbols in a row from the leftmost reel, as the
  table below shows. Wins of different lines add up.
- **Wild.** The red octopus lands on reels 2, 3 and 4 only and stands in for every symbol except the
  Scatter. A line of only Wilds pays as Compass.
- **The Grab (tentacles).** Before lines are counted, every Octopus that landed throws 2 to 4
  tentacles at random cells. Each grabbed cell becomes a Wild with ×2, ×3 or ×5. Scatters and cells
  that were Wild already are never grabbed; a cell hit twice adds its multipliers.
- **Multipliers.** The multipliers of the Wilds in a winning line add up, and the sum multiplies
  that line's win once: ×2 and ×3 on one line pay ×5.
- **Scatter.** The treasure chest. 3, 4 or 5 Chests anywhere start 8, 10 or 12 free spins.
- **Free spins.** Played at the bet that started them, free of charge. Every Wild that lands or is
  grabbed during the series stays in place with its multiplier until the series ends. Chests
  during the series start nothing new.
- **Bonus Buy.** 10 free spins straight away for 88 × bet, after a confirmation dialog.
- **Big Win and Mega Win.** A round that wins 10 × bet or more gets the Big Win overlay with a
  count-up and falling coins. From 25 × bet it is Mega Win.

Payouts, in multiples of the total bet:

| Symbol  | 3   | 4   | 5   |
| ------- | --- | --- | --- |
| Compass | 1.5 | 5   | 15  |
| Map     | 1   | 3   | 8   |
| Anchor  | 0.8 | 2   | 6   |
| Rum     | 0.5 | 1.5 | 4   |
| A, K    | 0.3 | 0.8 | 2   |
| Q, J    | 0.2 | 0.5 | 1.5 |

The **i** button opens the same paytable in the game, at the current bet. After two Chests in the
base game the remaining reels spin longer under a gold light.

To spin, press the Spin button, Space or Enter. While the reels turn, the same button reads Stop
and lands them at once with the usual landing animation. While a result is on screen it reads
Skip and jumps the current step to its end; skipping the win lines also skips the Big Win that
follows. The − and + buttons change the bet between rounds, and the speaker button mutes sound and
remembers the choice.

The reel strips and weights are tuned by simulation for a target RTP of about 96%: a run of
3 million spins gives 97.9%. `npm run simulate` reproduces the
numbers for any seed and length.

## Debug and scenarios

The game runs on a mock server (`games/octo-vault/src/mock`). Without parameters the reels stop at
random positions on their strips, as a real server would. The page address can change that:

| Address              | What it does                                                                                                  |
| -------------------- | ------------------------------------------------------------------------------------------------------------- |
| `?seed=7`            | Replays the same rounds. Every session prints its seed to the console: `Pirate's Fortune mock seed: …`        |
| `?scenario=<name>`   | Every spin stops on one fixed field (list below). The Grab and free spins after it still come from the seed   |
| `?scenario=playlist` | Goes through `win`, `nowin`, `multiwin`, `scatter`, `wild`, `tentacles`, `nowin`, `bigwin`, `megawin` in turn |
| `?scenario=error`    | Every round fails like an unreachable server: the bet is returned and a message is shown                      |
| `?debug=layout`      | Draws the design area and the bounds and anchor point of every layout node                                    |

Scenarios: `nowin`, `win`, `multiwin`, `wild`, `tentacles`, `scatter`, `freespins4`, `freespins5`,
`bigwin`, `megawin`, `error`, `playlist`. An unknown name or seed is reported in the console and
ignored. Parameters combine:

```
http://localhost:5173/?scenario=tentacles&seed=3
http://localhost:5173/?scenario=scatter&debug=layout
http://localhost:4173/?scenario=megawin
```

`npm run simulate -- --spins 1000000 --bonus 50000 --seed 7 --bet 100` runs the same round code
as the mock and prints RTP, base game and free spins share, hit rate, free spins, Big Win and Mega
Win frequency and the largest win.

## Architecture

```
games/octo-vault ─┐                      ┌─ pixi.js, @pixi/sound
templates/game  ──┼──▶  slot-sdk  ───────┤
games/<new>     ──┘   (src/index.ts)     └─ (ecs, flow, math: no Pixi at all)
```

Dependencies point one way. A game imports only `slot-sdk` (and `slot-sdk/vite` in its Vite
config). The SDK never imports a game. Both rules are enforced by ESLint
(`no-restricted-imports`), so a violation fails `npm run lint` and CI.

```
packages/slot-sdk/src/
  core/       createSlotGame, SlotGame (start-up order), GameContext, EventBus, GameModel, Feature
  ecs/        World, components, systems                                        no Pixi
  flow/       StateMachine, RoundFlow, RoundPlayer, standard steps, IdleWinReplay no Pixi
  math/       round contract (ResultSource, RoundResult, steps), money, seeded Rng no Pixi
  reels/      ReelGrid, ReelMotionSystem, ReelGridView, stop calculation, motion blur
  wins/       Highlight, FieldWinView (lines and amounts), Big Win overlay, particles
  layout/     LayoutManager, LayoutConfig, layout math, ?debug=layout
  assets/     manifest types, loader with retry, loading screen, symbol placeholders
  ui/         Button, Hud and HudPresenter, LabeledValue, WinCounter, Popup
  audio/      GameAudio over @pixi/sound: play by alias, mute, hidden tab
  character/  CharacterActor: a layered character that plays named animations
  anim/       tween, wait, easing
games/octo-vault/src/
  config/     symbols, paytable, paylines, reel strips and timing, features, sound, character, rules
  math/       line evaluation, the Grab, free spins, Bonus Buy, playRound      game math, no Pixi
  mock/       MockResultSource, scenarios, seed                                 the pretend server
  features/   tentacleGrab, freeSpins, bonusBuy, anticipation, character, rules, sound
  scene/      background and ambience, logo, the reels and frame, multiplier badges
  assets.ts   manifest     layout.ts   landscape and portrait     main.ts   the whole game wiring
templates/game/   minimal 3×3 game with placeholder symbols, copied by create-game
scripts/          create-game.mjs
```

The SDK holds what any slot needs: the canvas with resize and DPR, asset loading and the loading
screen, the reel field as ECS entities, spin and stop, the round state machine and the player for
round scripts, win lines and highlights, Big Win, the HUD, a popup, sound and a character actor.

The game holds what makes it Pirate's Fortune: symbols and art, paytable, paylines, reel strips,
the Grab, free spins, Bonus Buy and how they look, the captain's animations, the layout, the texts
and the mock server.

The SDK knows nothing about the theme because it never needs to. Symbol ids are plain strings,
steps are `{ type }` objects, looks are config objects and art is a manifest alias. The Grab, free
spins and Bonus Buy were added without editing the SDK, and `packages/slot-sdk` still has no
mention of tentacles, multipliers or free spins.

`ecs`, `flow` and `math` do not import Pixi. What may happen when, which step plays next and what a
win is worth should not depend on how any of it is drawn. Because these modules run in plain Node,
the state machine, round player, ECS and money are tested without a renderer, and the game's math
runs in `npm run simulate`.

The game's own math (line evaluation, the Grab, free spins) is in `games/octo-vault/src/math`. The
mock and the simulation call it; in production it would run on the server, and the client only
plays the steps it receives. Line evaluation can move into the SDK once a second game with paylines
needs it. For now it sits next to the math it was balanced with.

The game's presentation is in `games/octo-vault/src/features` and `src/scene`. Each mechanic is a
`Feature` that registers handlers for its own round steps and draws its own objects.

### How a round plays

```
Idle ──Spin──▶ Spinning ──result received──▶ Presenting ──script done──▶ Idle
                  └──── request failed: bet returned ────────────────────▶ Idle
```

The state machine answers "what can the player do now". The round script answers "what to show".
The result source returns the whole round as a list of steps; `RoundPlayer` finds the handler of
each step by its `type` and waits for it. Skip aborts the current step's signal.

```ts
// A base spin with the Grab, as the mock returns it (minor units)
[
  { type: 'reveal', grid },                               // SDK: spin and land on this field
  { type: 'tentacles', grabs: [{ from, hits: [...] }] },  // game: cells become Wilds ×2/×3/×5
  { type: 'wins', wins, amount: 450 },                    // SDK: show lines and amounts
  { type: 'totalWin', amount: 450 },                      // SDK: round total, Big Win if large
]
```

A free spins series arrives in the same single result: `freeSpinsStart`, then
`freeSpinsUpdate` / `reveal` / `tentacles` / `wins` per spin, then `freeSpinsEnd` and `totalWin`.
A new mechanic adds a step type and its handler; it never adds a state:

```ts
import type { Feature, RoundStep } from 'slot-sdk';

// 1. The step, as the result source will send it.
interface ChestOpenStep extends RoundStep {
  readonly type: 'chestOpen';
  readonly prize: number;
}

// 2. Its handler, installed by a feature listed in main.ts.
export function chestOpen(): Feature {
  return {
    install(context) {
      context.steps.register<ChestOpenStep>('chestOpen', async (step, skip) => {
        // Show step.prize, e.g. with tween(). When `skip` aborts, jump to the end state.
      });
    },
  };
}
```

`games/octo-vault/src/features/tentacleGrab/tentacleGrab.ts` is the full real example. A script
with a step type nobody registered fails before its first step with an error naming that type.

## Patterns and why they are here

| Pattern                              | Why                                                                                                                                                                       | Where                                                                                |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| Composition root                     | The start-up order is plain code you read top to bottom, without a DI container or global state                                                                           | `core/SlotGame.ts` `start()`, game `main.ts`                                         |
| Plugin (`Feature`)                   | A game adds mechanics without editing the SDK: each feature gets the `GameContext` once                                                                                   | `core/Feature.ts`; every folder in `games/octo-vault/src/features`                   |
| Strategy (`ResultSource`)            | The mock and a real server client are interchangeable; the client does not change                                                                                         | `math/round.ts`, `games/octo-vault/src/mock/MockResultSource.ts`                     |
| Round as a script + handler registry | The server decides, the client only shows. New mechanic = new step type + handler                                                                                         | `math/round.ts`, `flow/RoundPlayer.ts`, `context.steps.register`                     |
| State machine                        | All round transitions in one table; an illegal transition throws instead of corrupting state                                                                              | `flow/StateMachine.ts`, `flow/RoundFlow.ts` (`idle`, `spinning`, `presenting`)       |
| Observer (typed event bus)           | HUD, sound and the captain react to the round without knowing the reels. Games extend the event map by module augmentation                                                | `core/EventBus.ts`, `core/GameEvents.ts`, `games/octo-vault/src/events.ts`           |
| ECS (small, own)                     | Many similar objects whose behavior changes: a multiplier or a hold is a component, a mechanic is a system. Only the reel field uses it; HUD and popups are plain classes | `ecs/World.ts`, `reels/`, `wins/Highlight.ts`; game `Multiplier`, `MultiplierBadges` |
| Presenter                            | HUD logic (what is enabled, what the Spin button says) is plain TypeScript, tested without Pixi                                                                           | `ui/HudPresenter.ts` behind `ui/Hud.ts`                                              |
| Data-driven config                   | Tuning a number is a config edit, not a code change, and the compiler checks it                                                                                           | `config/*.ts`, `layout.ts`, `assets.ts`                                              |

A few smaller choices sit next to these. Animations use a 60-line `tween` on the Pixi ticker that
returns a Promise and can `finish()` early for Skip, so GSAP was not needed. Money is kept in whole
minor units. The math takes a seeded `Rng` and never calls `Math.random()`.

The captain is assembled from raster layers by `buildLayeredCharacter` and animated by
`CharacterActor`, a small runtime in the SDK. Its calls (play, queue, loop, crossfade, wait for the
end) follow the Spine actor API, and the game maps moments to animations in
`config/character.config.ts`. A Spine skeleton could replace the layers later without touching
that mapping.

## SDK boundary

Games import from two entry points: `slot-sdk` (`packages/slot-sdk/src/index.ts`) and
`slot-sdk/vite`. ESLint rejects anything deeper, such as `slot-sdk/src/reels/...`. The index is the
contract, so the internals can be split, renamed or rewritten without breaking the games built on
top, and a reviewer can read the whole API in one file. Every public export has JSDoc.

Shared between games: `createSlotGame`, `GameContext`, the round contract, reels, wins, HUD, popup,
layout, assets, audio, tween, `CharacterActor`, `createRng` and `pickWeighted`.

Kept in each game: symbol ids, paytable, paylines, strips, every mechanic and its steps, the server
or mock, art, sounds, texts, layout and the order of features in `main.ts`.

When a game needs more, it uses an extension point instead of changing the SDK: custom steps
(`context.steps`), components and systems (`context.world`), extra HUD buttons
(`context.hud.addButton`, `addIconButton`), events (`context.events`), held cells (`Held`), or a
longer spin for one reel (`ReelMotionSystem.delayStop`).

## Creating a new game in 5 steps

**1. Create it from the template.**

```sh
npm run create-game treasure-hunt
npm run dev -w games/treasure-hunt
```

The script copies `templates/game` to `games/treasure-hunt`, fills in the package name and title
("Treasure Hunt") and runs `npm install`. It refuses an invalid or taken name and never overwrites
anything. The new game already plays: a 3×3 field, four placeholder symbols (cherry, lemon, bell,
seven), one payline on the middle row, HUD, both orientations.

**2. Describe symbols and assets.** List symbol ids in `src/config/symbols.ts`, then give each a
look in `src/assets.ts`. A placeholder (`{ color, label }`) works until the art exists; replace it
with `{ src: 'assets/symbols/seven.svg' }`. Put the strips that contain the new symbol in
`src/config/reels.config.ts`. Missing a symbol in the manifest is a compile error.

**3. Place things in `src/layout.ts`.** One node list for `landscape` (1920×1080) and one for
`portrait` (1080×1920). Both must place the same nodes, including the HUD's `spinButton`,
`balance`, `bet`, `win` and `message`. Check with `?debug=layout`.

**4. Plug in the results.** `src/mock/MockResultSource.ts` is the pretend server: it picks a
field and returns `reveal` → `wins` → `totalWin`. Put your game's math there, or replace the class
with a client of your real server that implements `ResultSource`. A new mechanic is a `Feature`:
register its step handler in `install` and add it to `features` in `src/main.ts`; `src/reels.ts`
shows a complete feature.

**5. Run and check.**

```sh
npm run build -w games/treasure-hunt && npm run preview -w games/treasure-hunt
npm run typecheck -w games/treasure-hunt
npx vitest run games/treasure-hunt
npm run lint
```

`games/treasure-hunt/README.md` repeats which file holds what. CI does the same on every push: it
creates a throwaway game from the template and lints, typechecks, tests and builds it.

## Resources

Game files live in `games/<game>/public/assets/`, and Vite copies them to `dist/` unchanged. Only
`public/` ships.

`src/assets.ts` is the manifest. It lists every file once as `{ alias, src }`, and code and config
refer to the alias: `Assets.get('coin')`, `context.audio.play('win')`, `skin: 'bonusSkin'`. The
`preload` bundle (the logo) loads first and the loading screen shows it, with a progress bar for
the `game` bundle. If a file fails to load, the player gets a message and a Retry button, and the
scene is never left half-built.

The manifest is typed. `satisfies AssetManifest<SymbolId>` turns a symbol without art into a compile
error, and `createSlotGame` also rejects duplicate aliases and fonts without a `family`.

Images can be SVG, PNG or WebP. `resolution: 2` rasterizes an SVG at double density, which helps
art drawn at the exact size it is shown. Audio is any format `@pixi/sound` reads (WAV here), played
by alias. A font is a file entry with a `family`.

The SDK ships no art of its own. Its loading screen, symbol placeholders, buttons and counters are
drawn from config colors and the game's fonts.

In Pirate's Fortune, the symbols, plaques and reel frame are SVGs generated by deterministic
scripts in `games/octo-vault/scripts/`. `make-sounds.mjs` synthesizes the sounds and music, and the
HUD is hand-written SVG. The captain's source layers are kept in `games/octo-vault/art/`, outside
`public/`, so they stay out of the build. `scripts/clean-captain.mjs` writes the cleaned layers the
game loads into `public/assets/captain/`.

Sources and licences for every file are in [CREDITS.md](CREDITS.md).

## Layout

Each game describes two layouts in `layout.ts`: `landscape` at 1920×1080 and `portrait` at
1080×1920. Each is a list of named nodes `{ x, y, scale?, anchor?, visible? }`, so moving something
means changing a number. A feature attaches its object to a node with
`context.layout.addNode('reels', view)`.

The layout is picked by shape: landscape when the screen is at least as wide as it is tall,
portrait otherwise. Turning a phone switches it right away.

The design area is scaled to fit inside the screen and centered, while the background is scaled to
cover the whole screen, margins included. That holds from a 320 px wide phone to an ultrawide
monitor.

`ResizeObserver` and `orientationchange` re-apply the layout at most once per frame, including in
the middle of a spin or a Big Win. The page itself never scrolls or zooms (`touch-action: none`,
`100dvh`).

The canvas renders at `min(devicePixelRatio, 2)` with `autoDensity`. Retina screens stay sharp, and
phones with a DPR of 3 don't pay for a 3× buffer. A DPR change from browser zoom or a different
monitor is picked up on the next resize.

`index.html` pads `<body>` with `env(safe-area-inset-*)`. The design area fits inside that padding,
clear of notches and home bars, and the background still fills the screen edge to edge.

Add `?debug=layout` to see the design area frame and every node's bounds and anchor point.

Scene layers, from back to front: `background`, `scene`, `reels`, `winOverlay`, `hud`, `popups`,
`debug`.

## Tests and checks

452 unit tests cover the pure logic: ECS, state machine, round player and round flow, reel motion
and stop calculation, layout math, assets and manifest checks, tween, money and Rng, HUD presenter,
character animation state, the game's line evaluation, Grab, free spins, Bonus Buy, mock and
simulation, and the `create-game` CLI. Rendering is verified in the browser on nine screen sizes
from 320×640 to 2560×1080, in both orientations and at DPR 1, 2 and 3. CI
(`.github/workflows/ci.yml`) runs lint, typecheck, tests and build, then the template check above.

## Performance

Measured on the production build over 220 spins in a row (full presentation, Stop, Skip and both):

- 165 FPS and 13 to 16 draw calls per frame, without a texture atlas.
- Scene objects, ticker handlers and the JS heap stay flat from spin to spin, so nothing leaks.
- 225 KB of gzipped JavaScript in total, 60 KB in the main chunk. `@pixi/sound` and the renderers
  load lazily.
- Keeping the character sources outside `public/` halved the build, from 8.6 to 4.2 MB.

## Roadmap

- Sounds in a compressed format (OGG/MP3) for a lighter download.
- A QA pass on iOS Safari and Android Chrome hardware.
- Move line evaluation into the SDK together with the second game that has paylines.

## More documentation

- [CREDITS.md](CREDITS.md): sources and licences of every resource.
- [templates/game/README.md](templates/game/README.md): the new game's file map.
