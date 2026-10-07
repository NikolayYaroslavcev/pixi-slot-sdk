// Draws the reel frame into public/assets/scene/reel-frame.svg at the size it is shown, so the
// nine-slice in scene/reels.ts has nothing left to stretch and the compass, skulls and ropes on
// its sides keep their shape. The window is the field panel (reels.config.ts: 5 × 170 + 4 × 12
// + 2 × 28 by 4 × 170 + 3 × 12 + 2 × 28) divided by `reelFrameLook.thickness` (0.6); after
// changing either, update `window` here and in scenery.config.ts: `node scripts/make-frame.mjs`.
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const outFile = join(
  dirname(fileURLToPath(import.meta.url)),
  '../public/assets/scene/reel-frame.svg',
);

const border = 165;
const window = { width: 1590, height: 1287 };
const W = window.width + border * 2;
const H = window.height + border * 2;

/** Draws `content` in each corner, mirrored from the top-left one. */
const corners = (content) =>
  [
    '',
    `translate(${W} 0) scale(-1 1)`,
    `translate(0 ${H}) scale(1 -1)`,
    `translate(${W} ${H}) scale(-1 -1)`,
  ]
    .map((transform) => `<g transform="${transform}">${content}</g>`)
    .join('');

/** Draws `content` on the left side and mirrored on the right. */
const sides = (content) =>
  `<g>${content}</g><g transform="translate(${W} 0) scale(-1 1)">${content}</g>`;

const rope = (y) => `<path d="M91 ${y}q-25 32 0 64t0 64t0 64"/>`;
const skull = (y) => `<g transform="translate(91 ${y})">
    <circle cx="0" cy="0" r="31"/><path d="M-18 22h36v25h-36z"/>
    <circle cx="-11" cy="-3" r="7" fill="#29130a"/><circle cx="11" cy="-3" r="7" fill="#29130a"/>
    <path d="M-8 16h16" stroke="#29130a" stroke-width="5"/></g>`;
const stud = (x, y) => `<circle cx="${x}" cy="${y}" r="10"/>`;

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
  <defs>
    <linearGradient id="wood" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#9a5725"/><stop offset=".22" stop-color="#5c2d13"/>
      <stop offset=".52" stop-color="#2c140b"/><stop offset=".8" stop-color="#6b3515"/>
      <stop offset="1" stop-color="#1b0d08"/>
    </linearGradient>
    <linearGradient id="gold" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#fff3a6"/><stop offset=".25" stop-color="#ffd85e"/>
      <stop offset=".55" stop-color="#b87317"/><stop offset=".8" stop-color="#7b3c0a"/>
      <stop offset="1" stop-color="#f4c84c"/>
    </linearGradient>
    <linearGradient id="goldBar" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#fff3a6"/><stop offset=".4" stop-color="#ffd85e"/>
      <stop offset=".75" stop-color="#b87317"/><stop offset="1" stop-color="#6b3008"/>
    </linearGradient>
    <linearGradient id="inner" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#3b1c0d"/><stop offset=".5" stop-color="#160a06"/>
      <stop offset="1" stop-color="#35170b"/>
    </linearGradient>
    <filter id="shadow" x="-10%" y="-10%" width="120%" height="125%">
      <feDropShadow dx="0" dy="18" stdDeviation="16" flood-color="#000" flood-opacity=".75"/>
    </filter>
    <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="7" result="b"/>
      <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <pattern id="grain" width="90" height="90" patternUnits="userSpaceOnUse">
      <path d="M4 17q20-13 43 0t39-2M12 51q24-14 48 0t29-4M8 78q20-10 46 1" fill="none" stroke="#d27a2d" stroke-opacity=".18" stroke-width="5"/>
    </pattern>
    <mask id="window" maskUnits="userSpaceOnUse" x="0" y="0" width="${W}" height="${H}">
      <rect width="${W}" height="${H}" fill="#fff"/>
      <rect x="${border}" y="${border}" width="${window.width}" height="${window.height}" rx="8" fill="#000"/>
    </mask>
  </defs>
  <g mask="url(#window)">
  <rect x="42" y="42" width="${W - 84}" height="${H - 84}" rx="52" fill="#140905" stroke="#070403" stroke-width="20" filter="url(#shadow)"/>
  <rect x="54" y="54" width="${W - 108}" height="${H - 108}" rx="44" fill="url(#wood)" stroke="url(#gold)" stroke-width="26"/>
  <rect x="74" y="74" width="${W - 148}" height="${H - 148}" rx="32" fill="url(#grain)" opacity=".9"/>
  <rect x="108" y="108" width="${W - 216}" height="${H - 216}" rx="25" fill="url(#gold)" stroke="#4a2309" stroke-width="13"/>
  <rect x="137" y="137" width="${W - 274}" height="${H - 274}" rx="14" fill="url(#inner)" stroke="#e6b73e" stroke-width="8"/>

  <path d="M125 125h${W - 250}l-35 42H160z" fill="#6f3714" stroke="#efc44e" stroke-width="6"/>
  <path d="M125 ${H - 125}h${W - 250}l-35-42H160z" fill="#6f3714" stroke="#efc44e" stroke-width="6"/>

  ${corners(`<path d="M88 245v-91q0-36 36-36h91v40h-71q-16 0-16 16v71z" fill="url(#gold)" stroke="#3e1c08" stroke-width="8"/>
    <g fill="#ffd75c" stroke="#6d3309" stroke-width="6"><circle cx="112" cy="112" r="17"/><circle cx="147" cy="147" r="11"/></g>`)}

  <g fill="#ffd75c" stroke="#6d3309" stroke-width="5">
    ${[0.3, 0.7].map((share) => stud(W * share, 93) + stud(W * share, H - 93)).join('')}
  </g>

  <g transform="translate(${W / 2} 93)" filter="url(#glow)">
    <path d="M-150 0h300" stroke="url(#goldBar)" stroke-width="14" stroke-linecap="round"/>
    <circle r="44" fill="#183d47" stroke="url(#gold)" stroke-width="11"/>
    <path d="M0-33l11 33-11 33-11-33zM-33 0l33-11 33 11-33 11z" fill="#f0d16b"/>
    <circle r="7" fill="#5d2b0b"/>
  </g>

  <g fill="none" stroke="#c48a3c" stroke-width="13" stroke-linecap="round">
    ${sides(rope(Math.round(H * 0.24)) + rope(Math.round(H * 0.62)))}
  </g>
  <g fill="#e9d4a0" stroke="#4b250e" stroke-width="7">
    ${sides(skull(Math.round(H * 0.5)))}
  </g>

  <path d="M155 ${H - 93}q${W / 2 - 155} 35 ${W - 310} 0" fill="none" stroke="#f5ce58" stroke-width="7" opacity=".7"/>
  </g>
</svg>
`;

writeFileSync(outFile, svg);
console.log(`Wrote ${outFile} (${W} × ${H}, window ${window.width} × ${window.height})`);
