import { mockAudio } from '@/testing/mocks';
import { resetApp } from '@/testing/stores';
import { playSound, soundsEnabled } from '@shared/sound';
import { useSettings } from '@/store/settings';

beforeEach(() => {
  resetApp();
  mockAudio.mode.mockClear();
});

/**
 * Plan §7.4: a soft chime for a found word and a gentle arpeggio for a finished puzzle, on by default at a
 * gentle volume. The sounds are the shared set (check, complete) and follow the Settings toggle.
 */
describe('game sounds', () => {
  it('are on by default and play at a gentle volume', () => {
    expect(useSettings.getState().settings.sounds).toBe(true);
    expect(soundsEnabled()).toBe(true);
    playSound('check');
    playSound('complete');
    expect(mockAudio.players).toHaveLength(2);
    for (const p of mockAudio.players) {
      expect(p.volume).toBeGreaterThan(0.3);
      expect(p.volume).toBeLessThanOrEqual(0.6);
      expect(p.play).toHaveBeenCalledTimes(1);
    }
  });
  it('reuses a player, starting from the beginning each time', () => {
    playSound('check');
    playSound('check');
    expect(mockAudio.players).toHaveLength(1);
    expect(mockAudio.players[0].seekTo).toHaveBeenCalledWith(0);
    expect(mockAudio.players[0].play).toHaveBeenCalledTimes(2);
  });
  it('stays silent when sounds are off in Settings, and plays again when they are back on', () => {
    useSettings.getState().update({ sounds: false });
    expect(soundsEnabled()).toBe(false);
    playSound('check');
    expect(mockAudio.players).toHaveLength(0);
    useSettings.getState().update({ sounds: true });
    playSound('check');
    expect(mockAudio.players).toHaveLength(1);
  });
  it('never throws when audio is unavailable', () => {
    mockAudio.failCreate = true;
    expect(() => playSound('complete')).not.toThrow();
  });
});
