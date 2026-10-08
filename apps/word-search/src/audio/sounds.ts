import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';
import { useSettings } from '@/store/settings';

/** Plan §7.4: soft chime when a word is found, a gentle arpeggio when the puzzle is complete, at 60% volume. */
export const SOUND_VOLUME = 0.6;

const SOURCES = {
  found: require('../../assets/sounds/found.wav'),
  complete: require('../../assets/sounds/complete.wav'),
} as const;
export type SoundName = keyof typeof SOURCES;

const players: Partial<Record<SoundName, AudioPlayer>> = {};
let configured = false;

/** Never throws: a game without sound is still a game. */
export function playSound(name: SoundName): void {
  if (!useSettings.getState().settings.sounds) return;
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
