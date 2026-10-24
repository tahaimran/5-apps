/** The generated files (scripts/generate-sounds.mjs): real 16-bit mono WAVs, short and small. */
import * as fs from 'fs';
import * as path from 'path';
import type { SoundName } from '../index';

const DIR = path.resolve(__dirname, '../../../assets/sounds');
const NAMES: SoundName[] = ['tap', 'check', 'undo', 'complete', 'celebrate', 'wrong', 'tick'];

/** Seconds of audio in a PCM WAV, read from its header. */
function wavInfo(file: string) {
  const buf = fs.readFileSync(file);
  return {
    riff: buf.toString('ascii', 0, 4),
    wave: buf.toString('ascii', 8, 12),
    channels: buf.readUInt16LE(22),
    rate: buf.readUInt32LE(24),
    bits: buf.readUInt16LE(34),
    seconds: buf.readUInt32LE(40) / (buf.readUInt32LE(24) * 2),
    bytes: buf.length,
  };
}

describe.each(NAMES)('%s.wav', (name) => {
  const info = wavInfo(path.join(DIR, `${name}.wav`));
  it('is a 16-bit mono PCM WAV', () => {
    expect([info.riff, info.wave, info.channels, info.bits]).toEqual(['RIFF', 'WAVE', 1, 16]);
  });
  it('stays a short accent under 64 KB', () => {
    expect(info.seconds).toBeLessThanOrEqual(1.4);
    expect(info.bytes).toBeLessThan(64 * 1024);
  });
});

describe('the quiz pair', () => {
  it('keeps the countdown tick shorter than a tap-length click and the wrong answer under 0.4 s', () => {
    expect(wavInfo(path.join(DIR, 'tick.wav')).seconds).toBeLessThanOrEqual(0.06);
    expect(wavInfo(path.join(DIR, 'wrong.wav')).seconds).toBeLessThan(0.4);
  });
});
