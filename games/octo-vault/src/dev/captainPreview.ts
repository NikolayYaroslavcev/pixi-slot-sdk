// Dev stand: the octopus captain alone, large, with a button per animation. `npm run dev`, then /captain.html.
import { Application, Assets, Graphics, type Texture } from 'pixi.js';
import { buildLayeredCharacter, CharacterActor } from 'slot-sdk';
import { captainAlias, captainPictures, characterConfig } from '../config/character.config';
import { octopusAnimations } from '../features/character/octopusAnimations';

const app = new Application();
await app.init({ resizeTo: window, background: '#2a3440', antialias: true });
document.body.appendChild(app.canvas);
await Assets.load(
  captainPictures.map((picture) => ({
    alias: captainAlias(picture),
    src: `assets/captain/${picture}.png`,
  })),
);
const { view, parts } = buildLayeredCharacter({
  layers: characterConfig.layers,
  origin: characterConfig.origin,
  texture: (alias) => Assets.get<Texture>(alias),
});
const actor = new CharacterActor({
  view,
  parts,
  animations: octopusAnimations,
  ticker: app.ticker,
  mixMs: characterConfig.mixMs,
});
const ground = new Graphics().rect(-400, 0, 800, 2).fill('#ffffff55');
app.stage.addChild(ground, view);
const place = (): void => {
  const scale = Math.min(app.screen.width / 520, app.screen.height / 560);
  view.scale.set(scale);
  view.position.set(app.screen.width / 2, app.screen.height * 0.82);
  ground.position.copyFrom(view.position);
};
place();
window.addEventListener('resize', place);

const params = new URLSearchParams(location.search);
const bar = document.getElementById('bar') ?? document.body;
for (const name of actor.animations) {
  const button = document.createElement('button');
  button.textContent = name;
  button.onclick = () => {
    void actor.play(name, { loop: true });
  };
  bar.appendChild(button);
}
void actor.play(params.get('anim') ?? 'idle', { loop: true });
// Freeze at a moment for screenshots: ?anim=win&at=450
const at = params.get('at');
if (at) {
  setTimeout(() => {
    app.ticker.stop();
  }, Number(at));
}
