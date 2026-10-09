import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';
import { useSettings } from '@/store/settings';

/** Plan §7: correct chime, soft wrong buzz, tick in the last 5 s, level-up fanfare, all short. */
export const SOUND_VOLUME = 0.6;

const SOURCES = {
  correct: require('../../assets/sounds/correct.wav'),
  wrong: require('../../assets/sounds/wrong.wav'),
  tick: require('../../assets/sounds/tick.wav'),
  levelup: require('../../assets/sounds/levelup.wav'),
} as const;
export type SoundName = keyof typeof SOURCES;

const players: Partial<Record<SoundName, AudioPlayer>> = {};
let configured = false;

/** Never throws: a quiz without sound is still a quiz. */
export function playSound(name: SoundName): void {
  if (!useSettings.getState().settings.sound) return;
  try {
    if (!configured) {
      configured = true;
      // Respect the phone's silent mode and let the player's own music keep playing.
      void setAudioModeAsync({ playsInSilentMode: false, interruptionMode: 'mixWithOthers' }).catch(() => undefined);
    }
    let player = players[name];
    if (!player) {
      player = createAudioPlayer(SOURCES[name]);
      player.volume = SOUND_VOLUME;
      players[name] = player;
    }
    void player.seekTo(0);
    player.play();
  } catch {
    // ignore
  }
}

/** Tests only. */
export const resetSounds = () => {
  for (const k of Object.keys(players) as SoundName[]) delete players[k];
  configured = false;
};
