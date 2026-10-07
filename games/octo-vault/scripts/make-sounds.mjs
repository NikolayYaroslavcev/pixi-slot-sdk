// Synthesizes the game's sounds into public/assets/sfx as 16-bit mono WAV.
// Everything is generated from oscillators and seeded noise, so the sounds are project-owned
// and the same files come out on every run: `node scripts/make-sounds.mjs`.
import { Buffer } from 'node:buffer';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const rate = 22_050;
const outDir = join(dirname(fileURLToPath(import.meta.url)), '../public/assets/sfx');

let noiseState = 7;
function noise() {
  // xorshift: seeded, so the files do not change between runs.
  noiseState ^= noiseState << 13;
  noiseState ^= noiseState >>> 17;
  noiseState ^= noiseState << 5;
  return ((noiseState >>> 0) / 0xffffffff) * 2 - 1;
}

/** Fills `seconds` of audio with `sample(t, i)`. */
function render(seconds, sample) {
  const data = new Float32Array(Math.round(seconds * rate));
  for (let i = 0; i < data.length; i += 1) {
    data[i] = sample(i / rate, i);
  }
  return data;
}

const envelope = (t, attack, decay) => (t < attack ? t / attack : Math.exp(-(t - attack) / decay));

/** A tone with a few soft harmonics and its own pitch curve. */
function tone(t, frequency, phase = 0) {
  const x = 2 * Math.PI * frequency * t + phase;
  return Math.sin(x) + 0.35 * Math.sin(2 * x) + 0.12 * Math.sin(3 * x);
}

/** One-pole low-pass over a whole buffer, `cutoff` in Hz, may change over time. */
function lowPass(data, cutoff) {
  let last = 0;
  for (let i = 0; i < data.length; i += 1) {
    const c = typeof cutoff === 'function' ? cutoff(i / rate) : cutoff;
    const k = 1 - Math.exp((-2 * Math.PI * c) / rate);
    last += k * (data[i] - last);
    data[i] = last;
  }
  return data;
}

/** A short decaying copy of the signal, like a small wooden room below deck. */
function echo(data, delaySeconds, feedback, repeats = 4) {
  const delay = Math.round(delaySeconds * rate);
  for (let r = 0; r < repeats; r += 1) {
    for (let i = data.length - 1; i >= delay; i -= 1) {
      data[i] += data[i - delay] * feedback;
    }
  }
  return data;
}

function chime(frequencies, seconds, spacing, decay) {
  return render(seconds, (t) =>
    frequencies.reduce((sum, frequency, index) => {
      const local = t - index * spacing;
      return local < 0 ? sum : sum + tone(local, frequency) * envelope(local, 0.004, decay);
    }, 0),
  );
}

const semitone = 2 ** (1 / 12);
/** Frequency of a note name such as `D5`, `C#4` or `Bb3`. */
function pitch(name) {
  const steps = { C: -9, D: -7, E: -5, F: -4, G: -2, A: 0, B: 2 }[name[0]];
  const accidental = name[1] === '#' ? 1 : name[1] === 'b' ? -1 : 0;
  const octave = Number(name.at(-1));
  return 440 * semitone ** (steps + accidental + (octave - 4) * 12);
}

/**
 * Adds a note into `data` from `start` seconds for `seconds`, its sound from `voice(t, f, length)`.
 * With `wrap` the tail past the end continues at the start, so a loop has no seam.
 */
function play(data, { start, seconds, frequency, voice, gain, wrap = false }) {
  const from = Math.round(start * rate);
  const length = Math.round((seconds + 0.6) * rate);
  for (let i = 0; i < length; i += 1) {
    const index = wrap ? (from + i) % data.length : from + i;
    if (index < data.length) data[index] += voice(i / rate, frequency, seconds) * gain;
  }
}

/** A bowed string: bright harmonics, a slow vibrato and a short release after `length`. */
function fiddle(t, frequency, length) {
  const vibrato = 1 + 0.005 * Math.sin(2 * Math.PI * 5.5 * t) * Math.min(1, t / 0.2);
  const x = 2 * Math.PI * frequency * vibrato * t;
  const body = Math.sin(x) + 0.5 * Math.sin(2 * x) + 0.3 * Math.sin(3 * x) + 0.15 * Math.sin(4 * x);
  const release = t < length ? 1 : Math.max(0, 1 - (t - length) / 0.08);
  return body * Math.min(1, t / 0.035) * release * (0.8 + 0.2 * Math.exp(-t / 0.3));
}

/** An accordion squeeze: odd harmonics of two reeds a little apart, so it beats. */
function squeeze(t, frequency, length) {
  const reed = (f) =>
    Math.sin(2 * Math.PI * f * t) +
    Math.sin(6 * Math.PI * f * t) / 3 +
    Math.sin(10 * Math.PI * f * t) / 5;
  const release = t < length ? 1 : Math.max(0, 1 - (t - length) / 0.05);
  return (reed(frequency) + reed(frequency * 1.004)) * Math.min(1, t / 0.02) * release;
}

/** A plucked bass string. */
function pluck(t, frequency) {
  const x = 2 * Math.PI * frequency * t;
  return (Math.sin(x) + 0.4 * Math.sin(2 * x)) * envelope(t, 0.005, 0.3);
}

/** A frame drum: a falling low thump with a little skin noise. */
function drum(t) {
  const thump = Math.sin(2 * Math.PI * (95 - 40 * Math.min(1, t / 0.12)) * t);
  return thump * envelope(t, 0.002, 0.13) + noise() * envelope(t, 0.001, 0.02) * 0.3;
}

/** A ship's bell: metal partials that do not sit on one harmonic series, ringing long. */
function bell(t, frequency) {
  return [1, 2, 2.6, 3.01, 4.17].reduce(
    (sum, ratio, index) =>
      sum +
      (Math.sin(2 * Math.PI * frequency * ratio * t) * envelope(t, 0.002, 1.4 / (index + 1))) /
        (index + 1),
    0,
  );
}

/** Coins spilling: short bright pings at random moments over `seconds`. */
function coins(seconds, count) {
  const data = new Float32Array(Math.round((seconds + 0.3) * rate));
  const ping = (t, f) => Math.sin(2 * Math.PI * f * t) * envelope(t, 0.001, 0.05);
  for (let coin = 0; coin < count; coin += 1) {
    const start = ((noise() + 1) / 2) * seconds;
    const frequency = 2600 + ((noise() + 1) / 2) * 2600;
    play(data, { start, seconds: 0.01, frequency, voice: ping, gain: 0.25 });
  }
  return data;
}

function mix(...layers) {
  const length = Math.max(...layers.map((layer) => layer.length));
  return Float32Array.from({ length }, (_, i) =>
    layers.reduce((sum, layer) => sum + (layer[i] ?? 0), 0),
  );
}

const eighth = 0.2;
/** The shanty: 16 bars of 6/8 in D minor. Each bar: its bass, its chord, its tune as [note, eighths]. */
const shanty = [
  [
    'D3',
    'Dm',
    [
      ['A4', 1],
      ['D5', 2],
      ['D5', 1],
      ['E5', 1],
      ['F5', 1],
    ],
  ],
  [
    'C3',
    'C',
    [
      ['E5', 2],
      ['C5', 1],
      ['G4', 2],
      ['C5', 1],
    ],
  ],
  [
    'D3',
    'Dm',
    [
      ['D5', 1],
      ['F5', 2],
      ['A5', 1],
      ['G5', 1],
      ['F5', 1],
    ],
  ],
  [
    'A2',
    'A',
    [
      ['E5', 3],
      ['C#5', 2],
      ['A4', 1],
    ],
  ],
  [
    'D3',
    'Dm',
    [
      ['D5', 2],
      ['F5', 1],
      ['A5', 2],
      ['F5', 1],
    ],
  ],
  [
    'Bb2',
    'Bb',
    [
      ['G5', 2],
      ['F5', 1],
      ['D5', 2],
      ['Bb4', 1],
    ],
  ],
  [
    'C3',
    'C',
    [
      ['C5', 1],
      ['E5', 2],
      ['G5', 1],
      ['F5', 1],
      ['E5', 1],
    ],
  ],
  [
    'A2',
    'A',
    [
      ['C#5', 2],
      ['E5', 1],
      ['D5', 3],
    ],
  ],
  [
    'F2',
    'F',
    [
      ['A5', 2],
      ['G5', 1],
      ['F5', 2],
      ['C5', 1],
    ],
  ],
  [
    'C3',
    'C',
    [
      ['E5', 2],
      ['D5', 1],
      ['C5', 2],
      ['G4', 1],
    ],
  ],
  [
    'D3',
    'Dm',
    [
      ['A4', 1],
      ['D5', 1],
      ['F5', 1],
      ['A5', 2],
      ['G5', 1],
    ],
  ],
  [
    'A2',
    'A',
    [
      ['E5', 3],
      ['A4', 3],
    ],
  ],
  [
    'Bb2',
    'Bb',
    [
      ['Bb4', 1],
      ['D5', 2],
      ['F5', 1],
      ['G5', 1],
      ['F5', 1],
    ],
  ],
  [
    'F2',
    'F',
    [
      ['A5', 3],
      ['F5', 2],
      ['C5', 1],
    ],
  ],
  [
    'A2',
    'A',
    [
      ['E5', 2],
      ['G5', 1],
      ['C#5', 2],
      ['E5', 1],
    ],
  ],
  ['D3', 'Dm', [['D5', 6]]],
];
const chords = {
  Dm: ['D4', 'F4', 'A4'],
  C: ['C4', 'E4', 'G4'],
  A: ['C#4', 'E4', 'A4'],
  Bb: ['Bb3', 'D4', 'F4'],
  F: ['C4', 'F4', 'A4'],
};

/** Bass and drum on the two beats of a bar, the squeezebox on the eighths between them. */
function shantyBeat(data, barStart, bass, chord) {
  for (const beat of [0, 3]) {
    const start = barStart + beat * eighth;
    const frequency = pitch(bass) * (beat ? 1.5 : 1);
    play(data, { start, seconds: 0.3, frequency, voice: pluck, gain: 0.5, wrap: true });
    play(data, { start, seconds: 0.1, frequency: 0, voice: drum, gain: 0.35, wrap: true });
  }
  for (const offbeat of [1, 2, 4, 5]) {
    for (const note of chords[chord]) {
      const start = barStart + offbeat * eighth;
      const frequency = pitch(note);
      play(data, { start, seconds: 0.12, frequency, voice: squeeze, gain: 0.045, wrap: true });
    }
  }
}

/** One bar of the shanty into `data`: the beat, and the tune on the fiddle over it. */
function shantyBar(data, barIndex, [bass, chord, melody]) {
  const barStart = barIndex * 6 * eighth;
  shantyBeat(data, barStart, bass, chord);
  let position = 0;
  for (const [note, length] of melody) {
    const start = barStart + position * eighth;
    const seconds = length * eighth - 0.03;
    play(data, { start, seconds, frequency: pitch(note), voice: fiddle, gain: 0.16, wrap: true });
    position += length;
  }
}

/** A fanfare on the fiddle doubled by the squeezebox an octave down, in D major. */
function fanfare() {
  const data = new Float32Array(Math.round(3 * rate));
  const notes = [
    ['D5', 0, 0.2],
    ['F#5', 0.2, 0.2],
    ['A5', 0.4, 0.2],
    ['D6', 0.6, 1.2],
  ];
  for (const [note, start, seconds] of notes) {
    const frequency = pitch(note);
    play(data, { start, seconds, frequency, voice: fiddle, gain: 0.35 });
    play(data, { start, seconds, frequency: frequency / 2, voice: squeeze, gain: 0.12 });
  }
  return data;
}

/** The shanty, looped without a seam, with a faint wash of waves under it. */
function music() {
  const data = new Float32Array(Math.round(shanty.length * 6 * eighth * rate));
  shanty.forEach((bar, barIndex) => {
    shantyBar(data, barIndex, bar);
  });
  const seconds = data.length / rate;
  const waves = lowPass(
    render(seconds, () => noise()),
    300,
  );
  return data.map((value, i) => {
    const t = i / rate;
    const edge = Math.min(1, t / 0.5, (seconds - t) / 0.5);
    const swell = 0.6 + 0.4 * Math.sin((2 * Math.PI * t) / seconds);
    return value + waves[i] * 0.35 * edge * swell;
  });
}

const sounds = {
  click: () => render(0.09, (t) => tone(t, 1250 - t * 5000) * envelope(t, 0.002, 0.018) * 0.7),

  spinStart: () =>
    lowPass(
      render(0.45, (t) => noise() * envelope(t, 0.12, 0.12) * 0.9),
      (t) => 300 + 2600 * Math.sin(Math.PI * Math.min(1, t / 0.45)),
    ),

  reelStop: () =>
    render(0.22, (t) => {
      const thud = Math.sin(2 * Math.PI * (120 - t * 220) * t) * envelope(t, 0.002, 0.05);
      const clack = noise() * envelope(t, 0.001, 0.008) * 0.35;
      return (thud + clack) * 0.9;
    }),

  scatterLand: () => echo(chime([784, 1175, 1568], 1.1, 0.05, 0.28), 0.11, 0.3),

  // A drum roll that swells while a reel spins in suspense.
  anticipation: () =>
    render(1.2, (t) => {
      const hit = t % 0.045;
      return drum(hit) * (0.25 + 0.75 * (t / 1.2)) * 0.9;
    }),

  tentacle: () => {
    const swish = lowPass(
      render(0.42, (t) => noise() * envelope(t, 0.05, 0.12)),
      (t) => 500 + 1800 * t,
    );
    const zap = render(0.42, (t) =>
      t < 0.18 ? 0 : tone(t, 220 + (t - 0.18) * 900) * envelope(t - 0.18, 0.004, 0.07) * 0.35,
    );
    return swish.map((value, index) => value * 0.9 + zap[index]);
  },

  multiplier: () => echo(chime([1047, 1319, 1760], 0.75, 0.045, 0.16), 0.09, 0.28),

  // Coins into the chest and one strike of the ship's bell.
  win: () =>
    mix(
      coins(0.6, 14),
      render(1.6, (t) => bell(t, 880) * 0.35),
    ),

  // The fanfare over a long shower of coins.
  bigWin: () => echo(mix(fanfare(), coins(2.4, 60)), 0.14, 0.22),

  // Two strikes of the ship's bell over a low horn: the crew is called to the treasure.
  freeSpins: () =>
    mix(
      render(2.4, (t) => bell(t, 660) * 0.4 + (t > 0.35 ? bell(t - 0.35, 660) * 0.4 : 0)),
      render(2.4, (t) => squeeze(t, pitch('D3'), 1.6) * 0.18),
    ),

  music,
};

function toWav(data) {
  const peak = data.reduce((max, value) => Math.max(max, Math.abs(value)), 0) || 1;
  const gain = 0.89 / peak;
  const buffer = Buffer.alloc(44 + data.length * 2);
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + data.length * 2, 4);
  buffer.write('WAVEfmt ', 8);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(rate, 24);
  buffer.writeUInt32LE(rate * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(data.length * 2, 40);
  data.forEach((value, index) => {
    buffer.writeInt16LE(
      Math.round(Math.max(-1, Math.min(1, value * gain)) * 32767),
      44 + index * 2,
    );
  });
  return buffer;
}

mkdirSync(outDir, { recursive: true });
for (const [name, make] of Object.entries(sounds)) {
  const file = join(outDir, `${name.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)}.wav`);
  writeFileSync(file, toWav(make()));
  console.info(file);
}
