// Draws the reel symbols into public/assets/symbols as 512 × 512 SVG tiles.
// Every symbol sits on the same carved wood tile with a gold rim, so the field reads as one set;
// the light behind the object tells the tier: warm lantern glow for paying symbols, crimson for
// the Wild, a gold burst for the Scatter. Lettering is the game's own font turned into paths
// (lib/glyphs.mjs): an SVG drawn as an image cannot reach the page's fonts, and paths keep the
// files small: `node scripts/make-symbols.mjs`.
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadFont, textPath } from './lib/glyphs.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(root, 'public/assets/symbols');
const font = loadFont(join(root, 'public/assets/fonts/LilitaOne-Regular.ttf'));

/** Polished gold: bright top, a dark band and a second reflection, as on cast metal. */
const goldStops = `
  <stop offset="0" stop-color="#fff7c9"/><stop offset=".22" stop-color="#ffd862"/>
  <stop offset=".48" stop-color="#c9801a"/><stop offset=".6" stop-color="#ffe08a"/>
  <stop offset=".82" stop-color="#a65812"/><stop offset="1" stop-color="#4f2305"/>`;

function defs({ glow, glowStrength }) {
  return `<defs>
  <linearGradient id="gold" x1="0" y1="0" x2="0" y2="1">${goldStops}</linearGradient>
  <linearGradient id="goldEdge" x1="0" y1="0" x2="1" y2="1">${goldStops}</linearGradient>
  <linearGradient id="wood" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#6a3518"/><stop offset=".45" stop-color="#43200d"/><stop offset="1" stop-color="#241006"/>
  </linearGradient>
  <radialGradient id="glow" cx="256" cy="246" r="215" gradientUnits="userSpaceOnUse">
    <stop offset="0" stop-color="${glow}" stop-opacity="${glowStrength}"/>
    <stop offset=".55" stop-color="${glow}" stop-opacity="${glowStrength * 0.35}"/>
    <stop offset="1" stop-color="${glow}" stop-opacity="0"/>
  </radialGradient>
  <radialGradient id="vignette" cx="256" cy="256" r="300" gradientUnits="userSpaceOnUse">
    <stop offset=".6" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".55"/>
  </radialGradient>
  <linearGradient id="shine" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#fff" stop-opacity=".55"/><stop offset=".45" stop-color="#fff" stop-opacity=".08"/>
    <stop offset=".5" stop-color="#fff" stop-opacity="0"/>
  </linearGradient>
  <clipPath id="face"><rect x="42" y="42" width="428" height="428" rx="38"/></clipPath>
  <filter id="drop" x="-20%" y="-20%" width="140%" height="150%">
    <feDropShadow dx="0" dy="14" stdDeviation="10" flood-color="#0d0401" flood-opacity=".75"/>
  </filter>
</defs>`;
}

/** Wood grain lines, irregular so neighbouring tiles do not look stamped. */
function grain(seed) {
  let s = seed;
  const rnd = () => (s = (s * 9301 + 49297) % 233280) / 233280;
  let lines = '';
  for (let y = 58; y < 470; y += 22 + rnd() * 14) {
    const a = (rnd() - 0.5) * 18;
    const b = (rnd() - 0.5) * 18;
    lines += `<path d="M30 ${y.toFixed(0)} q110 ${a.toFixed(1)} 226 0 t226 ${b.toFixed(1)}" stroke="#120602" stroke-opacity="${(0.12 + rnd() * 0.12).toFixed(2)}" stroke-width="${(2 + rnd() * 3).toFixed(1)}" fill="none"/>`;
  }
  return lines;
}

function tile(seed) {
  const studs = [74, 438]
    .flatMap((x) => [74, 438].map((y) => [x, y]))
    .map(
      ([x, y]) =>
        `<circle cx="${x}" cy="${y}" r="9" fill="url(#gold)" stroke="#3a1806" stroke-width="3"/><circle cx="${x - 3}" cy="${y - 3}" r="3" fill="#fff6c9"/>`,
    )
    .join('');
  return `
  <rect x="10" y="10" width="492" height="492" rx="66" fill="#140702"/>
  <rect x="18" y="18" width="476" height="476" rx="60" fill="url(#goldEdge)"/>
  <rect x="20" y="20" width="472" height="472" rx="58" fill="none" stroke="#fff3b8" stroke-opacity=".6" stroke-width="2"/>
  <rect x="34" y="34" width="444" height="444" rx="44" fill="#2a1104"/>
  <g clip-path="url(#face)">
    <rect x="42" y="42" width="428" height="428" fill="url(#wood)"/>
    ${grain(seed)}
    <rect x="42" y="42" width="428" height="428" fill="url(#glow)"/>
    <rect x="42" y="42" width="428" height="428" fill="url(#vignette)"/>
    <path d="M42 42h428v6q-214 26-428 0z" fill="#fff" fill-opacity=".1"/>
  </g>
  <rect x="42" y="42" width="428" height="428" rx="38" fill="none" stroke="#000" stroke-opacity=".5" stroke-width="4"/>
  ${studs}`;
}

/**
 * Draws the object `scale` times larger around the tile centre and `shiftY` lower; the tile itself
 * stays put. Together they keep a tall object, shadow included, inside the wood face (42…470).
 */
function svg(title, look, body, seed, scale = 1, shiftY = 0) {
  if (scale !== 1 || shiftY !== 0) {
    body = `<g transform="translate(256 ${256 + shiftY}) scale(${scale}) translate(-256 -256)">${body}</g>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
<title>${title}</title>
${defs(look)}
${tile(seed)}
${body}
</svg>
`;
}

const lantern = { glow: '#ffb347', glowStrength: 0.42 };

/** A royal: the letter cut from a coloured gem, set in gold. */
function royal(letter, light, deep, seed) {
  const gem = `<linearGradient id="gem" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="${light}"/><stop offset=".55" stop-color="${deep}"/><stop offset="1" stop-color="#0b0612"/></linearGradient>`;
  const letterPath = textPath(font, letter, { size: 330, x: 256, y: 372, align: 'middle' });
  const text = (attrs) => `<path d="${letterPath}" ${attrs}/>`;
  const body = `
  <defs>${gem}</defs>
  <g filter="url(#drop)">
    ${text('fill="#1c0802" stroke="#1c0802" stroke-width="40" stroke-linejoin="round"')}
    ${text('fill="url(#gem)" stroke="url(#gold)" stroke-width="16" stroke-linejoin="round" paint-order="stroke"')}
  </g>
  ${text('fill="url(#shine)"')}`;
  return svg(`Royal ${letter}`, lantern, body, seed);
}

const rum = svg(
  'Rum bottle',
  { ...lantern, glow: '#ffa236' },
  `
  <defs>
    <linearGradient id="glass" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#0d2e1c"/><stop offset=".3" stop-color="#3d8f57"/><stop offset=".55" stop-color="#1f5b37"/><stop offset="1" stop-color="#08190f"/>
    </linearGradient>
    <linearGradient id="liquor" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#5a2006"/><stop offset=".35" stop-color="#e8952e"/><stop offset=".6" stop-color="#b8601a"/><stop offset="1" stop-color="#3a1404"/>
    </linearGradient>
    <linearGradient id="paper" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fbebc2"/><stop offset="1" stop-color="#d7b277"/></linearGradient>
    <linearGradient id="cork" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#7a4a22"/><stop offset=".4" stop-color="#d49a5a"/><stop offset="1" stop-color="#6a3a16"/></linearGradient>
    <clipPath id="bottle"><path id="bottlePath" d="M224 120h64v62q0 30 38 54q30 20 30 58v122q0 34-34 34H190q-34 0-34-34V294q0-38 30-58q38-24 38-54z"/></clipPath>
  </defs>
  <g filter="url(#drop)">
    <path d="M224 120h64v62q0 30 38 54q30 20 30 58v122q0 34-34 34H190q-34 0-34-34V294q0-38 30-58q38-24 38-54z" fill="url(#glass)" stroke="#06140b" stroke-width="8"/>
    <g clip-path="url(#bottle)">
      <rect x="150" y="268" width="212" height="190" fill="url(#liquor)" opacity=".92"/>
      <path d="M150 268q53 -10 106 0t106 0v6q-53 10-106 0t-106 0z" fill="#ffd08a" opacity=".7"/>
    </g>
    <rect x="174" y="302" width="164" height="96" rx="10" fill="url(#paper)" stroke="#6b3a12" stroke-width="5"/>
    <rect x="184" y="312" width="144" height="76" rx="6" fill="none" stroke="#9a5a22" stroke-width="2"/>
    <path d="M208 336l20-14 28 8 28-8 20 14-20 12 20 14-20 12-28-8-28 8-20-12 20-14z" fill="none" stroke="#7a3410" stroke-width="5" stroke-linejoin="round" opacity=".55"/>
    <circle cx="256" cy="350" r="17" fill="#f3e3c0" stroke="#4a1e08" stroke-width="5"/>
    <circle cx="250" cy="347" r="3.5" fill="#4a1e08"/><circle cx="262" cy="347" r="3.5" fill="#4a1e08"/>
    <rect x="218" y="84" width="76" height="46" rx="10" fill="url(#cork)" stroke="#3a1a06" stroke-width="5"/>
    <path d="M214 124h84v18q-6 14-12 2q-6 22-14 4q-8 18-16 0q-8 22-16 2q-8 16-14 0q-6 14-12-6z" fill="#b51d24" stroke="#5a0a0e" stroke-width="4" stroke-linejoin="round"/>
    <path d="M222 128h68" stroke="#ff7a6a" stroke-width="4" stroke-linecap="round" opacity=".7"/>
  </g>
  <path d="M234 132v52q-2 30-40 58q-22 18-22 52v120" fill="none" stroke="#fff" stroke-width="9" stroke-linecap="round" opacity=".45"/>
  <path d="M338 300v110" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".22"/>`,
  11,
  1.05,
  -12,
);

const anchor = svg(
  'Anchor',
  { ...lantern, glow: '#ffb347' },
  `
  <defs>
    <linearGradient id="iron" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#e4eef2"/><stop offset=".35" stop-color="#7e98a4"/><stop offset=".6" stop-color="#3b5260"/><stop offset="1" stop-color="#121c22"/>
    </linearGradient>
    <linearGradient id="rope" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#8a5422"/><stop offset=".5" stop-color="#e2ad62"/><stop offset="1" stop-color="#7a4418"/></linearGradient>
  </defs>
  <g filter="url(#drop)">
    <circle cx="256" cy="110" r="34" fill="none" stroke="#10181d" stroke-width="30"/>
    <circle cx="256" cy="110" r="34" fill="none" stroke="url(#gold)" stroke-width="18"/>
    <path d="M118 296q14 128 138 128t138-128" fill="none" stroke="#10181d" stroke-width="44" stroke-linecap="round"/>
    <path d="M118 296q14 128 138 128t138-128" fill="none" stroke="url(#iron)" stroke-width="30" stroke-linecap="round"/>
    <path d="M84 318l34-70 42 62z" fill="url(#iron)" stroke="#10181d" stroke-width="7" stroke-linejoin="round"/>
    <path d="M428 318l-34-70-42 62z" fill="url(#iron)" stroke="#10181d" stroke-width="7" stroke-linejoin="round"/>
    <rect x="236" y="136" width="40" height="292" rx="14" fill="url(#iron)" stroke="#10181d" stroke-width="7"/>
    <rect x="160" y="166" width="192" height="36" rx="18" fill="url(#gold)" stroke="#3a1806" stroke-width="7"/>
    <circle cx="160" cy="184" r="20" fill="url(#gold)" stroke="#3a1806" stroke-width="6"/>
    <circle cx="352" cy="184" r="20" fill="url(#gold)" stroke="#3a1806" stroke-width="6"/>
    <circle cx="256" cy="420" r="24" fill="url(#gold)" stroke="#3a1806" stroke-width="6"/>
    <path d="M256 144q-70 30-14 74t40 70q-66 34-6 80" fill="none" stroke="#3a1a06" stroke-width="22" stroke-linecap="round"/>
    <path d="M256 144q-70 30-14 74t40 70q-66 34-6 80" fill="none" stroke="url(#rope)" stroke-width="14" stroke-linecap="round"/>
    <path d="M256 144q-70 30-14 74t40 70q-66 34-6 80" fill="none" stroke="#5a300c" stroke-width="14" stroke-dasharray="4 9" opacity=".7"/>
  </g>
  <path d="M246 150v262" stroke="#fff" stroke-width="6" stroke-linecap="round" opacity=".45"/>
  <path d="M134 312q18 84 92 104" fill="none" stroke="#fff" stroke-width="6" stroke-linecap="round" opacity=".35"/>`,
  23,
  1.06,
);

const map = svg(
  'Treasure map',
  { ...lantern, glow: '#ff9a3c' },
  `
  <defs>
    <linearGradient id="parch" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fdf0c8"/><stop offset=".6" stop-color="#e8c784"/><stop offset="1" stop-color="#b8833e"/></linearGradient>
    <linearGradient id="roll" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f6dfa2"/><stop offset=".5" stop-color="#c8924a"/><stop offset="1" stop-color="#6a3c14"/></linearGradient>
    <radialGradient id="burn" cx=".5" cy=".5" r=".7"><stop offset=".65" stop-color="#7a4114" stop-opacity="0"/><stop offset="1" stop-color="#5a2a08" stop-opacity=".75"/></radialGradient>
  </defs>
  <g transform="rotate(-7 256 256)">
    <g filter="url(#drop)">
      <path d="M126 140h260l-6 28 8 34-6 40 8 38-8 44 6 36-6 34H126l6-30-8-40 6-38-6-42 8-36-8-36z" fill="url(#parch)" stroke="#6a3a12" stroke-width="5"/>
      <path d="M126 140h260l-6 28 8 34-6 40 8 38-8 44 6 36-6 34H126l6-30-8-40 6-38-6-42 8-36-8-36z" fill="url(#burn)"/>
      <path d="M170 236q20-44 72-36t70-22q48-4 54 38t-26 70q-14 40-70 34t-72-26q-40-14-28-58z" fill="#9db063" stroke="#5a6a2a" stroke-width="5"/>
      <path d="M170 236q20-44 72-36t70-22q48-4 54 38t-26 70q-14 40-70 34t-72-26q-40-14-28-58z" fill="none" stroke="#4f8eae" stroke-width="3" stroke-dasharray="7 7" transform="translate(-10 8) scale(1.04)" opacity=".7"/>
      <path d="M230 236l16-24 16 24z" fill="#6a5a2a"/><path d="M262 232l12-18 12 18z" fill="#6a5a2a"/>
      <path d="M150 380q14-8 28 0t28 0M300 172q12-8 24 0t24 0" fill="none" stroke="#3f7f9e" stroke-width="5" stroke-linecap="round"/>
      <path d="M196 288q34 40 70 6t66 6" fill="none" stroke="#b01f26" stroke-width="7" stroke-dasharray="2 14" stroke-linecap="round"/>
      <path d="M318 280l36 36M354 280l-36 36" stroke="#4a0a0c" stroke-width="20" stroke-linecap="round"/>
      <path d="M318 280l36 36M354 280l-36 36" stroke="#d8262e" stroke-width="12" stroke-linecap="round"/>
      <g transform="translate(176 372)"><path d="M0-22l6 16 16 6-16 6-6 16-6-16-16-6 16-6z" fill="#8a4a16"/><circle r="4" fill="#f6e2b0"/></g>
      <rect x="108" y="116" width="296" height="40" rx="20" fill="url(#roll)" stroke="#4a2408" stroke-width="5"/>
      <rect x="108" y="384" width="296" height="40" rx="20" fill="url(#roll)" stroke="#4a2408" stroke-width="5"/>
      <path d="M124 128h264M124 396h264" stroke="#fff4cc" stroke-width="5" stroke-linecap="round" opacity=".6"/>
    </g>
  </g>`,
  37,
  1.14,
  -6,
);

const ticks = Array.from({ length: 32 }, (_, i) => {
  const long = i % 4 === 0;
  return `<path d="M256 ${long ? 160 : 166}V${long ? 182 : 176}" stroke="#5a3410" stroke-width="${long ? 5 : 3}" transform="rotate(${i * 11.25} 256 270)"/>`;
}).join('');

const compass = svg(
  'Compass',
  { ...lantern, glow: '#ffb347' },
  `
  <defs>
    <radialGradient id="dial" cx=".42" cy=".38" r=".7"><stop offset="0" stop-color="#fffaf0"/><stop offset=".7" stop-color="#ecd7a6"/><stop offset="1" stop-color="#b98a48"/></radialGradient>
    <linearGradient id="navy" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#5a8ad0"/><stop offset="1" stop-color="#132a52"/></linearGradient>
    <linearGradient id="red" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ff6a5a"/><stop offset="1" stop-color="#8a0e16"/></linearGradient>
  </defs>
  <g filter="url(#drop)">
    <circle cx="256" cy="112" r="24" fill="none" stroke="url(#gold)" stroke-width="14"/>
    <circle cx="256" cy="270" r="158" fill="#1c0802"/>
    <circle cx="256" cy="270" r="150" fill="url(#goldEdge)"/>
    <circle cx="256" cy="270" r="128" fill="#3a1806"/>
    <circle cx="256" cy="270" r="120" fill="url(#dial)"/>
    ${ticks}
    <path d="M256 186l18 66 66 18-66 18-18 66-18-66-66-18 66-18z" fill="url(#navy)" stroke="#0c1a33" stroke-width="4" stroke-linejoin="round" transform="rotate(45 256 270)"/>
    <path d="M256 160l26 110h-52z" fill="url(#red)" stroke="#4a0608" stroke-width="5" stroke-linejoin="round"/>
    <path d="M256 380l26-110h-52z" fill="#e8eef2" stroke="#3a4a56" stroke-width="5" stroke-linejoin="round"/>
    <path d="M256 160l-26 110h26z" fill="#fff" opacity=".25"/>
    <circle cx="256" cy="270" r="16" fill="url(#gold)" stroke="#3a1806" stroke-width="5"/>
    <path d="M244 132l12-14 12 14z" fill="#d8262e" stroke="#4a0608" stroke-width="3"/>
  </g>
  <path d="M168 220q30-76 116-86" fill="none" stroke="#fff" stroke-width="16" stroke-linecap="round" opacity=".38"/>
  <path d="M182 246q8-20 22-34" fill="none" stroke="#fff" stroke-width="8" stroke-linecap="round" opacity=".3"/>`,
  53,
  1.06,
);

const suckers = (points) =>
  points
    .map(
      ([x, y, r]) =>
        `<circle cx="${x}" cy="${y}" r="${r}" fill="#ffc2b0" stroke="#a8243a" stroke-width="3"/>`,
    )
    .join('');

const wild = svg(
  'Wild kraken',
  { glow: '#ff3a2e', glowStrength: 0.7 },
  `
  <defs>
    <radialGradient id="skin" cx=".36" cy=".3" r=".8"><stop offset="0" stop-color="#ff8a72"/><stop offset=".4" stop-color="#e2303c"/><stop offset="1" stop-color="#6a0a1a"/></radialGradient>
    <linearGradient id="arm" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e2303c"/><stop offset="1" stop-color="#7a0c1c"/></linearGradient>
    <linearGradient id="ribbon" x1="0" y1="0" x2="0" y2="1">${goldStops}</linearGradient>
  </defs>
  <g filter="url(#drop)">
    <g fill="none" stroke-linecap="round">
      <path d="M196 300q-80 6-100 72q-12 48 30 54q34 4 34-28" stroke="#3a0410" stroke-width="44"/>
      <path d="M316 300q80 6 100 72q12 48-30 54q-34 4-34-28" stroke="#3a0410" stroke-width="44"/>
      <path d="M222 318q-34 58-58 108" stroke="#3a0410" stroke-width="40"/>
      <path d="M290 318q34 58 58 108" stroke="#3a0410" stroke-width="40"/>
      <path d="M196 300q-80 6-100 72q-12 48 30 54q34 4 34-28" stroke="url(#arm)" stroke-width="32"/>
      <path d="M316 300q80 6 100 72q12 48-30 54q-34 4-34-28" stroke="url(#arm)" stroke-width="32"/>
      <path d="M222 318q-34 58-58 108" stroke="url(#arm)" stroke-width="28"/>
      <path d="M290 318q34 58 58 108" stroke="url(#arm)" stroke-width="28"/>
    </g>
    ${suckers([
      [118, 352, 7],
      [108, 384, 7],
      [132, 412, 6],
      [394, 352, 7],
      [404, 384, 7],
      [380, 412, 6],
      [190, 380, 6],
      [322, 380, 6],
    ])}
    <path d="M256 84c-96 0-146 70-146 146c0 62 44 104 146 104s146-42 146-104c0-76-50-146-146-146z" fill="#3a0410"/>
    <path d="M256 92c-88 0-136 64-136 138c0 56 40 96 136 96s136-40 136-96c0-74-48-138-136-138z" fill="url(#skin)"/>
    <circle cx="324" cy="164" r="10" fill="#8a1424" opacity=".45"/><circle cx="296" cy="132" r="7" fill="#8a1424" opacity=".45"/><circle cx="182" cy="182" r="8" fill="#8a1424" opacity=".4"/>
    <ellipse cx="208" cy="146" rx="50" ry="24" fill="#fff" opacity=".35" transform="rotate(-24 208 146)"/>
    <ellipse cx="212" cy="246" rx="34" ry="38" fill="#fff8ee" stroke="#3a0410" stroke-width="6"/>
    <ellipse cx="300" cy="246" rx="34" ry="38" fill="#fff8ee" stroke="#3a0410" stroke-width="6"/>
    <circle cx="220" cy="254" r="18" fill="#1a0608"/><circle cx="292" cy="254" r="18" fill="#1a0608"/>
    <circle cx="226" cy="246" r="6" fill="#fff"/><circle cx="298" cy="246" r="6" fill="#fff"/>
    <path d="M176 204l64 18M336 204l-64 18" stroke="#3a0410" stroke-width="12" stroke-linecap="round"/>
    <path d="M232 300q24 18 48 0" fill="none" stroke="#3a0410" stroke-width="8" stroke-linecap="round"/>
    <path d="M78 400l40-12v-26h276v26l40 12-24 26 24 26-56-6v14H134v-14l-56 6 24-26z" fill="#6a2a06" stroke="#2a0e02" stroke-width="6" stroke-linejoin="round"/>
    <path d="M118 362h276v84H118z" fill="url(#ribbon)" stroke="#2a0e02" stroke-width="6"/>
    <path d="M124 370h264" stroke="#fff7c9" stroke-width="4" opacity=".7"/>
    <path d="${textPath(font, 'WILD', { size: 80, x: 256, y: 434, align: 'middle', tracking: 0.05 })}" fill="#3a1004"/>
  </g>`,
  71,
  1.06,
  -8,
);

const coins = [
  [176, 246, 22],
  [214, 230, 24],
  [300, 232, 24],
  [338, 248, 22],
  [256, 222, 26],
  [194, 268, 22],
  [236, 258, 24],
  [280, 260, 24],
  [322, 270, 22],
]
  .map(
    ([x, y, r]) =>
      `<circle cx="${x}" cy="${y}" r="${r}" fill="url(#gold)" stroke="#5a2a06" stroke-width="4"/><circle cx="${x}" cy="${y}" r="${r - 8}" fill="none" stroke="#a8601a" stroke-width="3"/><circle cx="${x - r / 3}" cy="${y - r / 3}" r="${r / 5}" fill="#fff9d8"/>`,
  )
  .join('');

const rays = Array.from(
  { length: 12 },
  (_, i) =>
    `<path d="M256 236L238 30h36z" fill="#fff2b0" opacity=".22" transform="rotate(${i * 30} 256 236)"/>`,
).join('');

const chest = svg(
  'Treasure chest',
  { glow: '#ffd24a', glowStrength: 0.85 },
  `
  <defs>
    <linearGradient id="plank" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9a5226"/><stop offset=".5" stop-color="#5c2a10"/><stop offset="1" stop-color="#2e1206"/></linearGradient>
    <radialGradient id="hoard" cx=".5" cy=".6" r=".6"><stop offset="0" stop-color="#fffbe0"/><stop offset=".4" stop-color="#ffd24a" stop-opacity=".8"/><stop offset="1" stop-color="#ff9a2e" stop-opacity="0"/></radialGradient>
    <linearGradient id="red" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff5a4a"/><stop offset=".5" stop-color="#c41a26"/><stop offset="1" stop-color="#6a0610"/></linearGradient>
  </defs>
  <g clip-path="url(#face)">${rays}</g>
  <g filter="url(#drop)">
    <path d="M132 250L150 128q106-44 212 0l18 122z" fill="#2a1004" stroke="url(#gold)" stroke-width="12" stroke-linejoin="round"/>
    <path d="M160 236l12-90q84-30 168 0l12 90z" fill="#4a1e0a"/>
    <ellipse cx="256" cy="236" rx="150" ry="70" fill="url(#hoard)"/>
    ${coins}
    <path d="M226 206l18-24 18 24-18 22z" fill="#2ab0e6" stroke="#0a3a5a" stroke-width="4"/>
    <path d="M296 196l14-18 14 18-14 18z" fill="#3ae07a" stroke="#0a4a22" stroke-width="4"/>
    <path d="M168 220l14-18 14 18-14 18z" fill="#ff4a5a" stroke="#5a0a12" stroke-width="4"/>
    <path d="M110 268h292v122q0 18-18 18H128q-18 0-18-18z" fill="url(#plank)" stroke="#1c0802" stroke-width="7"/>
    <path d="M110 306h292M110 346h292" stroke="#1c0802" stroke-width="4" opacity=".55"/>
    <rect x="104" y="260" width="304" height="24" rx="8" fill="url(#gold)" stroke="#3a1806" stroke-width="5"/>
    <rect x="138" y="270" width="24" height="138" fill="url(#gold)" stroke="#3a1806" stroke-width="5"/>
    <rect x="350" y="270" width="24" height="138" fill="url(#gold)" stroke="#3a1806" stroke-width="5"/>
    <path d="M230 284h52v40q0 22-26 32q-26-10-26-32z" fill="url(#gold)" stroke="#3a1806" stroke-width="5"/>
    <circle cx="256" cy="306" r="8" fill="#1c0802"/><path d="M252 310h8l3 18h-14z" fill="#1c0802"/>
  </g>
  <g filter="url(#drop)">
    <path d="M70 410l36-10v-24h300v24l36 10-22 24 22 24-52-6v12H108v-12l-52 6 22-24z" fill="#5a0610" stroke="#2a0204" stroke-width="6" stroke-linejoin="round"/>
    <path d="M106 372h300v80H106z" fill="url(#red)" stroke="#2a0204" stroke-width="6"/>
    <path d="M112 380h288" stroke="#ffb0a0" stroke-width="4" opacity=".55"/>
    <path d="${textPath(font, 'SCATTER', { size: 62, x: 256, y: 434, align: 'middle', tracking: 0.03 })}" fill="#ffe7a0" stroke="#3a0406" stroke-width="8" stroke-linejoin="round" paint-order="stroke"/>
  </g>`,
  89,
);

const files = {
  'symbol_j.svg': royal('J', '#7ec4ff', '#1d5fc4', 101),
  'symbol_q.svg': royal('Q', '#e0a2ff', '#7a2cc4', 113),
  'symbol_k.svg': royal('K', '#8ef0a8', '#16944a', 127),
  'symbol_a.svg': royal('A', '#ff9a8a', '#c41a2a', 131),
  'rum_bottle.svg': rum,
  'anchor.svg': anchor,
  'treasure_map.svg': map,
  'compass.svg': compass,
  'wild_kraken.svg': wild,
  'treasure_chest.svg': chest,
};

for (const [name, content] of Object.entries(files)) {
  writeFileSync(join(outDir, name), content);
}
console.log(`Wrote ${Object.keys(files).length} symbols to ${outDir}`);
