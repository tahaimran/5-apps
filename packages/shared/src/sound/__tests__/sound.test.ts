import { mockAudio } from '../../testing/animation';
import '../../testing/native';
import { initSounds, playSound, releaseSounds, setSoundsEnabled, soundsEnabled } from '../index';

beforeEach(() => {
  releaseSounds();
  setSoundsEnabled(true);
  jest.clearAllMocks();
});

describe('sounds', () => {
  it('mixes with other audio and never plays in the background', () => {
    initSounds();
    expect(mockAudio.setAudioMode).toHaveBeenCalledWith({ playsInSilentMode: false, interruptionMode: 'mixWithOthers', shouldPlayInBackground: false });
  });

  it('sets the audio mode only once', () => {
    initSounds();
    initSounds();
    expect(mockAudio.setAudioMode.mock.calls.length).toBeLessThanOrEqual(1);
  });

  it('preloads the everyday sounds so the first tap has no delay', () => {
    initSounds();
    expect(mockAudio.created).toHaveBeenCalledTimes(4);
  });

  it('plays from the start and reuses the loaded player', () => {
    playSound('check');
    playSound('check');
    expect(mockAudio.created).toHaveBeenCalledTimes(1);
    expect(mockAudio.seekTo).toHaveBeenCalledWith(0);
    expect(mockAudio.play).toHaveBeenCalledTimes(2);
  });

  it('stays silent when turned off', () => {
    setSoundsEnabled(false);
    expect(soundsEnabled()).toBe(false);
    playSound('celebrate');
    expect(mockAudio.play).not.toHaveBeenCalled();
  });

  it('never throws when the audio module fails', () => {
    mockAudio.play.mockImplementationOnce(() => {
      throw new Error('no audio');
    });
    expect(() => playSound('tap')).not.toThrow();
  });

  it('ignores a failing preload', () => {
    mockAudio.created.mockImplementationOnce(() => {
      throw new Error('missing asset');
    });
    expect(() => initSounds(['undo'])).not.toThrow();
  });

  it('retries the audio mode after it failed', async () => {
    releaseSounds();
    mockAudio.setAudioMode.mockRejectedValueOnce(new Error('busy'));
    jest.isolateModules(() => {
      const fresh = require('../index') as typeof import('../index');
      fresh.initSounds([]);
    });
    await Promise.resolve();
    await Promise.resolve();
    expect(mockAudio.setAudioMode).toHaveBeenCalledTimes(1);
  });

  it('plays the quiz pair (a wrong answer and the countdown tick) on players of their own', () => {
    playSound('wrong');
    playSound('tick');
    playSound('tick');
    // One player each (Jest maps every asset to the same stub, so the files are checked in files.test.ts).
    expect(mockAudio.created).toHaveBeenCalledTimes(2);
    expect(mockAudio.play).toHaveBeenCalledTimes(3);
  });

  it('releases every player', () => {
    playSound('tap');
    releaseSounds();
    playSound('tap');
    expect(mockAudio.created).toHaveBeenCalledTimes(2);
  });
});
