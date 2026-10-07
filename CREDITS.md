# Credits

Where every resource of Pirate's Fortune (`games/octo-vault`) comes from and under what terms.

## Made for this project

| Resource                                 | Files                                            | How it is made                                                                                                             |
| ---------------------------------------- | ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------- |
| Reel symbols                             | `public/assets/symbols/*.svg`                    | `scripts/make-symbols.mjs`. Lettering is the Lilita One font turned into paths (`scripts/lib/glyphs.mjs`)                  |
| Big Win, Mega Win and free spins plaques | `public/assets/wins/*.svg`                       | `scripts/make-titles.mjs`, lettering as above                                                                              |
| Reel frame                               | `public/assets/scene/reel-frame.svg`             | `scripts/make-frame.mjs`                                                                                                   |
| Light rays, dust mote                    | `public/assets/scene/light-rays.svg`, `mote.svg` | SVG written by hand                                                                                                        |
| HUD: plates, buttons, icons, popup       | `public/assets/hud/*.svg`                        | SVG written by hand                                                                                                        |
| Effects: coin, spark                     | `public/assets/fx/*.svg`                         | SVG written by hand                                                                                                        |
| Favicon                                  | `public/favicon.svg`                             | SVG written by hand                                                                                                        |
| Sound effects and the shanty             | `public/assets/sfx/*.wav`                        | `scripts/make-sounds.mjs`: synthesized from oscillators and seeded noise, no samples. The tune is written for this project |

These belong to the project and have no third-party terms.

## Supplied by the project owner

| Resource                           | Files                                                                              | Notes                                                                                                                          |
| ---------------------------------- | ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Octopus captain, layer set v3      | sources `art/pirate-octopus-animation/`, game layers `public/assets/captain/*.png` | `scripts/clean-captain.mjs` removes labels, cell borders and halos from the raster layers and writes the layers the game loads |
| Background (pirate cove at sunset) | `public/assets/scene/pirate-cove.webp`                                             |                                                                                                                                |
| Logo «Pirate's Fortune»            | `public/assets/logo.webp`                                                          |                                                                                                                                |

The captain's sources stay outside `public/` and are not part of the build. To replace the art, put new layers into `art/pirate-octopus-animation/`, run `node scripts/clean-captain.mjs` and check the result on the stand `captain.html` (`npm run dev`, then `/captain.html`).

## Third-party

| Resource        | Files                                       | Author          | License                                                                                                                                           |
| --------------- | ------------------------------------------- | --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Lilita One font | `public/assets/fonts/LilitaOne-Regular.ttf` | Juan Montoreano | SIL Open Font License 1.1, text in `public/assets/fonts/OFL.txt`. Glyph outlines in the generated SVGs are derived from it and stay under the OFL |
