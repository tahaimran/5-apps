// Synthesizes the two game sounds (16-bit mono WAV, 22.05 kHz). No dependencies.
//   node scripts/make-sounds.mjs
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const rate = 22050;

/** notes: [startSeconds, hz, lengthSeconds]. Soft sine with a quick attack and an exponential decay. */
function render(notes, total) {
  const n = Math.floor(rate * total);
  const mix = new Float64Array(n);
  for (const [start, hz, len] of notes) {
    const from = Math.floor(start * rate);
    for (let i = 0; i < Math.floor(len * rate) && from + i < n; i++) {
      const t = i / rate;
      const env = Math.min(1, t * 200) * Math.exp(-t * (5 / len));
      mix[from + i] += (Math.sin(2 * Math.PI * hz * t) + 0.25 * Math.sin(4 * Math.PI * hz * t)) * env * 0.35;
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
// found: a soft two-note chime, about 250 ms
writeFileSync(resolve(root, 'assets/sounds/found.wav'), render([[0, 880, 0.18], [0.07, 1318.5, 0.18]], 0.27));
// complete: a gentle rising arpeggio C5 E5 G5 C6
writeFileSync(resolve(root, 'assets/sounds/complete.wav'), render([[0, 523.25, 0.3], [0.14, 659.25, 0.3], [0.28, 783.99, 0.3], [0.42, 1046.5, 0.5]], 1.0));
console.log('wrote assets/sounds/found.wav and complete.wav');
