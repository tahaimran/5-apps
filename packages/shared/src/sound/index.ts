import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';

/**
 * Short UI sounds (synthesized by scripts/generate-sounds.mjs). They mix with the user's music
 * instead of pausing it, never play in the background, and are off whenever the app says so.
 */
export type SoundName = 'tap' | 'check' | 'undo' | 'complete' | 'celebrate';

const sources: Record<SoundName, number> = {
  tap: require('../../assets/sounds/tap.wav'),
  check: require('../../assets/sounds/check.wav'),
  undo: require('../../assets/sounds/undo.wav'),
  complete: require('../../assets/sounds/complete.wav'),
  celebrate: require('../../assets/sounds/celebrate.wav'),
};

/** Quieter than full media volume: these are accents, not content. */
const VOLUME: Record<SoundName, number> = { tap: 0.35, check: 0.55, undo: 0.4, complete: 0.6, celebrate: 0.6 };

const players = new Map<SoundName, AudioPlayer>();
let enabled = true;
let modeSet: Promise<void> | null = null;

function playerFor(name: SoundName): AudioPlayer {
  let player = players.get(name);
  if (!player) {
    player = createAudioPlayer(sources[name]);
    player.volume = VOLUME[name];
    players.set(name, player);
  }
  return player;
}

/** Sets the audio mode and loads the given sounds so the first play has no delay. Safe to call again. */
export function initSounds(preload: SoundName[] = ['tap', 'check', 'undo', 'complete']): void {
  modeSet ??= setAudioModeAsync({
    playsInSilentMode: false,
    interruptionMode: 'mixWithOthers',
    shouldPlayInBackground: false,
  }).catch(() => {
    modeSet = null;
  });
  for (const name of preload) {
    try {
      playerFor(name);
    } catch {
      // A missing audio module (tests, a broken build) must never break the UI.
    }
  }
}

/** Turns all UI sounds on or off (an app's Settings toggle). */
export function setSoundsEnabled(on: boolean): void {
  enabled = on;
}

export const soundsEnabled = () => enabled;

/** Plays a UI sound from the start, cutting off its previous play. Never throws. */
export function playSound(name: SoundName): void {
  if (!enabled) return;
  try {
    const player = playerFor(name);
    void player.seekTo(0).catch(() => undefined);
    player.play();
  } catch {
    // ignore: sound is a nicety
  }
}

/** Frees every loaded sound (tests, or an app that turns sounds off for good). */
export function releaseSounds(): void {
  for (const player of players.values()) {
    try {
      player.remove();
    } catch {
      // already released
    }
  }
  players.clear();
}
