// Draws the game's lettered plaques: Big Win, Mega Win and the free spins intro and summary
// (public/assets/wins). Every word is the game's own font turned into paths (lib/glyphs.mjs),
// so the files need no font: `node scripts/make-titles.mjs`.
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadFont, textPath, textWidth } from './lib/glyphs.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const font = loadFont(join(root, 'public/assets/fonts/LilitaOne-Regular.ttf'));

const defs = `<defs>
  <linearGradient id="gold" x1="0" y1="0" x2="0" y2="1">
    <stop stop-color="#fffbd0"/><stop offset=".2" stop-color="#ffe052"/><stop offset=".5" stop-color="#f2a51c"/>
    <stop offset=".78" stop-color="#9b4108"/><stop offset="1" stop-color="#ffd44d"/>
  </linearGradient>
  <linearGradient id="red" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#ff5b39"/><stop offset=".5" stop-color="#b31314"/><stop offset="1" stop-color="#430707"/></linearGradient>
  <linearGradient id="shine" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".7"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/></linearGradient>
  <radialGradient id="coin" cx=".38" cy=".35" r=".7"><stop stop-color="#fff3a8"/><stop offset=".45" stop-color="#ffc83a"/><stop offset="1" stop-color="#a85a0a"/></radialGradient>
  <filter id="shadow" x="-20%" y="-30%" width="140%" height="170%"><feDropShadow dx="0" dy="12" stdDeviation="10" flood-color="#000" flood-opacity=".8"/></filter>
  <filter id="glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="9" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
</defs>`;

function svg(title, width, height, body) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
<title>${title}</title>
${defs}
${body}
</svg>
`;
}

/** Font size that makes `text` `width` wide, but never above `maxSize`. */
function fitSize(text, width, maxSize) {
  return Math.min(maxSize, (width / textWidth(font, text, 100)) * 100);
}

/**
 * Cast-gold lettering: a dark outline, the gold body with a thin rim and a shine on the upper
 * half. `d` is the path of the letters, `top` and `size` place the shine.
 */
function goldLetters(d, { outline, top, size, rim = '#6b2e06' }) {
  return `<path d="${d}" fill="#2a0e03" stroke="#2a0e03" stroke-width="${outline}" stroke-linejoin="round"/>
  <path d="${d}" fill="url(#gold)" stroke="${rim}" stroke-width="${Math.round(size / 30)}" stroke-linejoin="round"/>
  <path d="${d}" fill="url(#shineAt${Math.round(top)})"/>
  <linearGradient id="shineAt${Math.round(top)}" gradientUnits="userSpaceOnUse" x1="0" y1="${top}" x2="0" y2="${top + size * 0.75}">
    <stop stop-color="#fff" stop-opacity=".75"/><stop offset=".55" stop-color="#fff" stop-opacity="0"/>
  </linearGradient>`;
}

function compass(x, y, radius) {
  const point = radius * 0.8;
  const side = radius * 0.26;
  return `<g transform="translate(${x} ${y})" filter="url(#shadow)">
  <circle r="${radius}" fill="#124b5b" stroke="url(#gold)" stroke-width="${radius / 5}"/>
  <path d="M0-${point}l${side} ${point}-${side} ${point}-${side}-${point}zM-${point} 0l${point}-${side} ${point} ${side}-${point} ${side}z" fill="url(#gold)" stroke="#5a2706" stroke-width="5"/>
  <circle r="${radius / 5}" fill="#e82b34" stroke="#ffe87a" stroke-width="4"/>
</g>`;
}

/** A small heap of coins, `[x, y, r]` each, drawn from the back. */
function coins(list) {
  return list
    .map(
      ([x, y, r]) =>
        `<circle cx="${x}" cy="${y}" r="${r}" fill="url(#coin)" stroke="#6a3006" stroke-width="5"/><circle cx="${x}" cy="${y}" r="${r * 0.68}" fill="none" stroke="#ffe8a0" stroke-width="3" opacity=".8"/>`,
    )
    .join('');
}

/** The red star plaque with a gold rim and a dark window for the words. */
function plaque({ width, height, outerPath, windowPath, stroke }) {
  return `<g filter="url(#shadow)">
  <path d="${outerPath}" fill="url(#red)" stroke="url(#gold)" stroke-width="${stroke}" stroke-linejoin="round"/>
  <path d="${windowPath}" fill="#250b08" stroke="#ffe46c" stroke-width="${stroke * 0.6}"/>
</g>
<rect width="${width}" height="${height}" fill="none"/>`;
}

function titleOnPlaque(text, { centerX, baseline, width, maxSize }) {
  const size = fitSize(text, width, maxSize);
  const d = textPath(font, text, {
    size,
    x: centerX,
    y: baseline,
    align: 'middle',
    tracking: 0.02,
  });
  return goldLetters(d, { outline: size / 6, top: baseline - size * 0.75, size });
}

const smallPlaque = {
  width: 1000,
  height: 420,
  outerPath:
    'M84 210L145 157 117 90 230 116 274 43 330 101 500 62 670 101 726 43 770 116 883 90 855 157 916 210 855 263 883 330 770 304 726 377 670 319 500 358 330 319 274 377 230 304 117 330 145 263z',
  windowPath: 'M150 213Q500 90 850 213Q500 336 150 213z',
  stroke: 14,
};

function bigWin() {
  const studs = [126, 174, 826, 874]
    .map(
      (x, index) => `<circle cx="${x}" cy="${index % 3 === 0 ? 213 : 160}" r="8" fill="#ffe477"/>`,
    )
    .join('');
  const body = `${plaque(smallPlaque)}
${titleOnPlaque('BIG WIN', { centerX: 500, baseline: 258, width: 560, maxSize: 150 })}
${studs}`;
  return svg('Big Win', 1000, 420, body);
}

function megaWin() {
  const rays = `<g opacity=".8" filter="url(#glow)" fill="#ffd95a">
  <path d="M600 35l25 125-25 55-25-55z"/><path d="M265 92l160 78-31 40z"/><path d="M935 92L775 170l31 40z"/>
  <path d="M145 260l180-20-30 55z"/><path d="M1055 260l-180-20 30 55z"/>
</g>`;
  const body = `${rays}
${plaque({
  width: 1200,
  height: 520,
  outerPath:
    'M105 260l62-57-35-88 123 28 45-91 84 60 216-51 216 51 84-60 45 91 123-28-35 88 62 57-62 57 35 88-123-28-45 91-84-60-216 51-216-51-84 60-45-91-123 28 35-88z',
  windowPath: 'M154 261Q600 92 1046 261Q600 430 154 261z',
  stroke: 17,
})}
${titleOnPlaque('MEGA WIN', { centerX: 600, baseline: 318, width: 760, maxSize: 170 })}
${coins([
  [205, 406, 28],
  [260, 432, 23],
  [940, 406, 28],
  [885, 432, 23],
])}
${compass(600, 102, 48)}`;
  return svg('Mega Win', 1200, 520, body);
}

/** A rope across the top of the free spins plaque, with a flag hanging at each end. */
const ropeAndFlags = `<path d="M75 116Q550 18 1025 116" fill="none" stroke="#8a4b13" stroke-width="30" stroke-linecap="round"/>
<path d="M75 116Q550 18 1025 116" fill="none" stroke="#e6ae3b" stroke-width="10" stroke-dasharray="22 13"/>
<g fill="#641012" stroke="#d9a33a" stroke-width="6">
  <path d="M106 100q-32 62 2 118 31-17 65 8l-2-130q-33 15-65 4z"/>
  <path d="M994 100q32 62-2 118-31-17-65 8l2-130q33 15 65 4z"/>
</g>`;

const freeSpinsShape = {
  width: 1100,
  height: 560,
  outerPath:
    'M110 278L167 222l-28-77 105 23 43-76 64 50 199-47 199 47 64-50 43 76 105-23-28 77 57 56-57 56 28 77-105-23-43 76-64-50-199 47-199-47-64 50-43-76-105 23 28-77z',
  windowPath: 'M163 278Q550 130 937 278Q550 426 163 278z',
  stroke: 15,
};

/** The free spins plaque under a rope with two flags: `title` large, `subtitle` under it. */
function freeSpinsPlaque(name, title, subtitle) {
  const subtitleSize = fitSize(subtitle, 520, 46);
  const subtitlePath = textPath(font, subtitle, {
    size: subtitleSize,
    x: 550,
    y: 398,
    align: 'middle',
    tracking: 0.04,
  });
  const body = `
${ropeAndFlags}
${plaque(freeSpinsShape)}
${compass(550, 124, 62)}
${titleOnPlaque(title, { centerX: 550, baseline: 296, width: 640, maxSize: 132 })}
<path d="${subtitlePath}" fill="#3a1407" stroke="#3a1407" stroke-width="10" stroke-linejoin="round"/>
<path d="${subtitlePath}" fill="#fff0a0"/>
${coins([
  [230, 437, 34],
  [287, 458, 27],
  [870, 437, 34],
  [813, 458, 27],
])}`;
  return svg(name, 1100, 560, body);
}

const files = {
  'wins/big-win.svg': bigWin(),
  'wins/mega-win.svg': megaWin(),
  'wins/free-spins.svg': freeSpinsPlaque('Free spins', 'FREE SPINS', 'THE TREASURE AWAITS'),
  'wins/free-spins-won.svg': freeSpinsPlaque('Free spins won', 'TOTAL WIN', 'THE CHEST IS YOURS'),
};

for (const [name, content] of Object.entries(files)) {
  writeFileSync(join(root, 'public/assets', name), content);
}
console.log(`Wrote ${Object.keys(files).join(', ')}`);
