// Synthesizes the UI sound set into packages/shared/assets/sounds as 16-bit mono WAVs.
// Original, license-free sounds kept tiny on purpose (22.05 kHz). Run: node scripts/generate-sounds.mjs
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const RATE = 22050;
const out = join(dirname(fileURLToPath(import.meta.url)), '..', 'packages', 'shared', 'assets', 'sounds');

const note = (name) => {
  const names = { C: -9, D: -7, E: -5, F: -4, G: -2, A: 0, B: 2 };
  const m = /^([A-G])(#?)(\d)$/.exec(name);
  const semis = names[m[1]] + (m[2] ? 1 : 0) + (Number(m[3]) - 4) * 12;
  return 440 * 2 ** (semis / 12);
};

/** A soft bell/pluck: fundamental plus quiet harmonics, short attack, exponential decay. */
function tone(buf, startS, freq, { dur = 0.4, gain = 0.5, decay = 9, attack = 0.004, partials = [1, 0.18, 0.06] } = {}) {
  const start = Math.round(startS * RATE);
  const len = Math.round(dur * RATE);
  for (let i = 0; i < len && start + i < buf.length; i++) {
    const t = i / RATE;
    const env = Math.min(1, t / attack) * Math.exp(-decay * t);
    let s = 0;
    partials.forEach((amp, k) => (s += amp * Math.sin(2 * Math.PI * freq * (k + 1) * t)));
    buf[start + i] += s * env * gain;
  }
}

/** A filtered noise tick for taps. */
function tick(buf, startS, { dur = 0.03, gain = 0.25, freq = 2400 } = {}) {
  const start = Math.round(startS * RATE);
  const len = Math.round(dur * RATE);
  let seed = 7;
  for (let i = 0; i < len; i++) {
    seed = (seed * 16807) % 2147483647;
    const noise = seed / 2147483647 - 0.5;
    const t = i / RATE;
    const env = Math.exp(-160 * t);
    buf[start + i] += (noise * 0.35 + Math.sin(2 * Math.PI * freq * t)) * env * gain;
  }
}

function render(seconds, draw) {
  const buf = new Float32Array(Math.round(seconds * RATE));
  draw(buf);
  // Normalise to -3 dBFS peak and fade the tail so nothing clicks.
  const peak = buf.reduce((p, v) => Math.max(p, Math.abs(v)), 0) || 1;
  const fade = Math.round(0.02 * RATE);
  return buf.map((v, i) => (v / peak) * 0.7 * Math.min(1, (buf.length - i) / fade));
}

function wav(samples) {
  const data = Buffer.alloc(samples.length * 2);
  samples.forEach((v, i) => data.writeInt16LE(Math.round(Math.max(-1, Math.min(1, v)) * 32767), i * 2));
  const head = Buffer.alloc(44);
  head.write('RIFF', 0);
  head.writeUInt32LE(36 + data.length, 4);
  head.write('WAVEfmt ', 8);
  head.writeUInt32LE(16, 16);
  head.writeUInt16LE(1, 20); // PCM
  head.writeUInt16LE(1, 22); // mono
  head.writeUInt32LE(RATE, 24);
  head.writeUInt32LE(RATE * 2, 28);
  head.writeUInt16LE(2, 32);
  head.writeUInt16LE(16, 34);
  head.write('data', 36);
  head.writeUInt32LE(data.length, 40);
  return Buffer.concat([head, data]);
}

const sounds = {
  // Light UI tap (toggles, steppers).
  tap: render(0.06, (b) => tick(b, 0)),
  // A check-off: two quick rising plucks.
  check: render(0.32, (b) => {
    tone(b, 0, note('E5'), { dur: 0.25, decay: 18, gain: 0.5 });
    tone(b, 0.07, note('B5'), { dur: 0.25, decay: 14, gain: 0.55 });
  }),
  // Undo: one soft falling pluck.
  undo: render(0.22, (b) => {
    tone(b, 0, note('G5'), { dur: 0.1, decay: 30, gain: 0.35 });
    tone(b, 0.05, note('D5'), { dur: 0.16, decay: 22, gain: 0.35 });
  }),
  // Goal reached: a bright major arpeggio.
  complete: render(0.7, (b) => {
    ['C5', 'E5', 'G5', 'C6'].forEach((n, i) => tone(b, i * 0.07, note(n), { dur: 0.55, decay: 7, gain: 0.42 }));
  }),
  // Rare celebration (perfect day, milestones): arpeggio plus shimmer.
  celebrate: render(1.3, (b) => {
    ['G4', 'C5', 'E5', 'G5', 'C6', 'E6'].forEach((n, i) => tone(b, i * 0.065, note(n), { dur: 0.9, decay: 4.5, gain: 0.34 }));
    [0.45, 0.55, 0.62, 0.7].forEach((t, i) => tone(b, t, note(['G6', 'C7', 'E6', 'G6'][i]), { dur: 0.5, decay: 9, gain: 0.12, partials: [1] }));
  }),
  // A wrong answer: a soft, low two-step fall. Muted partials so it reads as "no", never as an alarm.
  wrong: render(0.34, (b) => {
    tone(b, 0, note('E4'), { dur: 0.16, decay: 16, gain: 0.45, partials: [1, 0.35, 0.1] });
    tone(b, 0.1, note('B3'), { dur: 0.24, decay: 12, gain: 0.45, partials: [1, 0.35, 0.1] });
  }),
  // Countdown tick (last seconds of a timer): a short wooden click, quieter than a tap.
  tick: render(0.05, (b) => tick(b, 0, { dur: 0.035, gain: 0.22, freq: 1400 })),
  // Notification chime: two gentle bell notes.
  reminder: render(1.4, (b) => {
    tone(b, 0, note('A5'), { dur: 1.1, decay: 3.2, gain: 0.45, partials: [1, 0.3, 0.12, 0.05] });
    tone(b, 0.22, note('E6'), { dur: 1.1, decay: 3, gain: 0.4, partials: [1, 0.3, 0.12, 0.05] });
  }),
};

mkdirSync(out, { recursive: true });
for (const [name, samples] of Object.entries(sounds)) {
  writeFileSync(join(out, `${name}.wav`), wav(samples));
  console.log(`${name}.wav  ${(samples.length / RATE).toFixed(2)}s`);
}
