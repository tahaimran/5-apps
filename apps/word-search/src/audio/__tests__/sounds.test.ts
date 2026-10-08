import { mockAudio } from '@/testing/mocks';
import { resetApp } from '@/testing/stores';
import { playSound, SOUND_VOLUME } from '../sounds';
import { useSettings } from '@/store/settings';

beforeEach(() => {
  resetApp();
  mockAudio.mode.mockClear();
});

describe('game sounds (plan §7.4)', () => {
  it('plays a chime for a found word and an arpeggio for a finished puzzle, at 60% volume', () => {
    playSound('found');
    playSound('complete');
    expect(mockAudio.players).toHaveLength(2);
    expect(mockAudio.players.map((p) => p.volume)).toEqual([SOUND_VOLUME, SOUND_VOLUME]);
    expect(SOUND_VOLUME).toBe(0.6);
    for (const p of mockAudio.players) expect(p.play).toHaveBeenCalledTimes(1);
  });
  it('reuses the player, starting from the beginning each time', () => {
    playSound('found');
    playSound('found');
    expect(mockAudio.players).toHaveLength(1);
    expect(mockAudio.players[0].seekTo).toHaveBeenCalledWith(0);
    expect(mockAudio.players[0].play).toHaveBeenCalledTimes(2);
  });
  it('stays silent when sounds are off in Settings', () => {
    useSettings.getState().update({ sounds: false });
    playSound('found');
    playSound('complete');
    expect(mockAudio.players).toHaveLength(0);
  });
  it('respects silent mode and lets other audio keep playing, set up once', () => {
    playSound('found');
    playSound('complete');
    expect(mockAudio.mode).toHaveBeenCalledTimes(1);
    expect(mockAudio.mode).toHaveBeenCalledWith({ playsInSilentMode: false, interruptionMode: 'mixWithOthers' });
  });
  it('never throws when audio is unavailable', () => {
    mockAudio.failCreate = true;
    expect(() => playSound('found')).not.toThrow();
  });
  it('is on by default', () => {
    expect(useSettings.getState().settings.sounds).toBe(true);
  });
});
