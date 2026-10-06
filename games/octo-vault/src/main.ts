import { Application, Graphics } from 'pixi.js';

const app = new Application();
await app.init({ background: '#062033', resizeTo: window });
document.body.appendChild(app.canvas);

const testRectangle = new Graphics().rect(-120, -80, 240, 160).fill('#f2b134');
testRectangle.position.set(app.screen.width / 2, app.screen.height / 2);
app.stage.addChild(testRectangle);
