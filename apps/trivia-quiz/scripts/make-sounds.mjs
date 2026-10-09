// Synthesizes the answer sounds (16-bit mono WAV, 22.05 kHz; the fanfare 16 kHz so each file stays under 30 KB). No dependencies.
//   node scripts/make-sounds.mjs
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

/** notes: [startSeconds, hz, lengthSeconds, harmonics?]. Soft sine with a quick attack and an exponential decay. */
function render(notes, total, rate = 22050) {
  const n = Math.floor(rate * total);
  const mix = new Float64Array(n);
  for (const [start, hz, len, buzz = false] of notes) {
    const from = Math.floor(start * rate);
    for (let i = 0; i < Math.floor(len * rate) && from + i < n; i++) {
      const t = i / rate;
      const env = Math.min(1, t * 200) * Math.exp(-t * (5 / len));
      const wave = buzz
        ? Math.sin(2 * Math.PI * hz * t) + 0.5 * Math.sin(2 * Math.PI * hz * 1.5 * t)
        : Math.sin(2 * Math.PI * hz * t) + 0.25 * Math.sin(4 * Math.PI * hz * t);
      mix[from + i] += wave * env * 0.35;
    }
  }
  const pcm = Buffer.alloc(n * 2);
  for (let i = 0; i < n; i++) pcm.writeInt16LE(Math.round(Math.max(-1, Math.min(1, mix[i])) * 32767), i * 2);
  const h = Buffer.alloc(44);
  h.write('RIFF', 0);
  h.writeUInt32LE(36 + pcm.length, 4);
  h.write('WAVEfmt ', 8);
  h.writeUInt32LE(16, 16);
  h.writeUInt16LE(1, 20);
  h.writeUInt16LE(1, 22);
  h.writeUInt32LE(rate, 24);
  h.writeUInt32LE(rate * 2, 28);
  h.writeUInt16LE(2, 32);
  h.writeUInt16LE(16, 34);
  h.write('data', 36);
  h.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([h, pcm]);
}

mkdirSync(resolve(root, 'assets/sounds'), { recursive: true });
// correct: a bright two-note chime, about 300 ms
writeFileSync(resolve(root, 'assets/sounds/correct.wav'), render([[0, 784, 0.2], [0.09, 1174.7, 0.22]], 0.31));
// wrong: a soft low buzz, about 300 ms
writeFileSync(resolve(root, 'assets/sounds/wrong.wav'), render([[0, 196, 0.3, true]], 0.32));
// tick: a very short click for the last 5 seconds
writeFileSync(resolve(root, 'assets/sounds/tick.wav'), render([[0, 1500, 0.04]], 0.05));
// levelup: a rising fanfare C5 E5 G5 C6
writeFileSync(resolve(root, 'assets/sounds/levelup.wav'), render([[0, 523.25, 0.3], [0.14, 659.25, 0.3], [0.28, 783.99, 0.3], [0.42, 1046.5, 0.5]], 0.9, 16000));
console.log('wrote assets/sounds/{correct,wrong,tick,levelup}.wav');
