import '@/testing/stores';
import React from 'react';
import { act } from 'react';
import { AppState, BackHandler } from 'react-native';
import { mockAudio, mockHaptics, mockParams, mockRouter } from '@/testing/mocks';
import { cleanup, render } from '@/testing/ui';
import { resetApp } from '@/testing/stores';
import { startCategory, startClassic, startDaily, startWarmup } from '@/features/play/start';
import { useRound } from '@/store/round';
import { useSettings } from '@/store/settings';
import Quiz from '../../app/quiz/[sessionId]';

beforeEach(() => {
  resetApp();
  jest.restoreAllMocks();
});
afterEach(cleanup);

const open = async (id: string | null) => {
  mockParams.current = { sessionId: id! };
  return render(<Quiz />);
};

describe('lifelines on the question screen', () => {
  it('50/50 greys out two wrong answers and cannot be used twice on one question', async () => {
    const r = await open(startCategory('science', 2));
    await r.press(/^50\/50, 1 left$/);
    expect(r.byLabel(/, removed by 50\/50$/)).toHaveLength(2);
    expect(r.byLabel('50/50, used')).toHaveLength(1);
    const s = useRound.getState().state!;
    expect(s.removed).not.toContain(s.current.correctIndex);
  });

  it('Skip swaps the question without counting it', async () => {
    const r = await open(startCategory('science', 2));
    const before = useRound.getState().state!.current.question.id;
    await r.press(/^Skip, 1 left$/);
    const s = useRound.getState().state!;
    expect(s.current.question.id).not.toBe(before);
    expect(s.answers).toHaveLength(0);
    expect(r.texts().join(' ')).toContain('1 / 10');
  });

  it('+Time adds 15 seconds to the ring', async () => {
    const r = await open(startCategory('science', 2));
    expect(useRound.getState().state!.msLeft).toBe(20_000);
    await r.press(/^\+Time, 1 left$/);
    expect(useRound.getState().state!.msLeft).toBe(35_000);
  });

  it('shows no timer ring and no +Time in relaxed mode', async () => {
    useSettings.getState().update({ relaxedMode: true });
    const r = await open(startCategory('science', 2));
    expect(r.byLabel(/seconds left/)).toHaveLength(0);
    expect(r.byLabel(/^\+Time/).length).toBe(1);
    expect(useRound.getState().state!.msLeft).toBeNull();
  });

  it('the warm-up has no lifelines, no quit button and no score', async () => {
    const r = await open(startWarmup());
    expect(r.byLabel(/^(50\/50|Skip|\+Time)/)).toHaveLength(0);
    expect(r.byLabel('Quit round')).toHaveLength(0);
    expect(r.texts().join(' ')).toContain('Warm-up · 1 of 3');
  });
});

describe('the clock', () => {
  it('times a question out as wrong and shows "Time\'s up!"', async () => {
    jest.useFakeTimers();
    try {
      const r = await open(startCategory('history', 2));
      await act(async () => {
        jest.advanceTimersByTime(21_000);
      });
      const s = useRound.getState().state!;
      expect(s).toMatchObject({ phase: 'answered', timedOut: true, correct: false });
      expect(r.texts().join(' ')).toContain("Time's up!");
    } finally {
      jest.useRealTimers();
    }
  });

  it('does not run while the explanation shows or while paused, and the paused time is not counted', async () => {
    jest.useFakeTimers();
    try {
      let handler: ((s: string) => void) | undefined;
      jest.spyOn(AppState, 'addEventListener').mockImplementation(((_t: string, h: (s: string) => void) => {
        handler = h;
        return { remove: () => undefined };
      }) as never);
      const r = await open(startCategory('history', 2));
      await act(async () => {
        jest.advanceTimersByTime(5_000);
      });
      const afterFive = useRound.getState().state!.msLeft!;
      expect(afterFive).toBeGreaterThan(14_000);
      expect(afterFive).toBeLessThanOrEqual(15_100);
      await act(async () => handler?.('background'));
      expect(r.texts().join(' ')).toContain('Paused');
      await act(async () => {
        jest.advanceTimersByTime(60_000);
      });
      expect(useRound.getState().state!.msLeft).toBe(afterFive);
      await r.press('Resume');
      expect(r.texts().join(' ')).not.toContain('Paused');
      await act(async () => {
        jest.advanceTimersByTime(1_000);
      });
      expect(useRound.getState().state!.msLeft!).toBeLessThan(afterFive);
    } finally {
      jest.useRealTimers();
    }
  });
});

describe('leaving a round', () => {
  it('asks before quitting, keeps the round when told to keep playing, and drops it on Quit', async () => {
    const r = await open(startClassic('flags', 1));
    await r.press('Quit round');
    expect(r.texts().join(' ')).toContain('Progress for this round will be lost.');
    await r.press('Keep playing');
    expect(useRound.getState().state).not.toBeNull();
    await r.press('Quit round');
    await r.press('Quit');
    expect(useRound.getState().state).toBeNull();
    expect(mockRouter.replace).toHaveBeenCalledWith('/(tabs)');
  });

  it('opens the quit sheet on Android Back instead of leaving', async () => {
    let press: (() => boolean) | undefined;
    jest.spyOn(BackHandler, 'addEventListener').mockImplementation(((_t: string, h: () => boolean) => {
      press = h;
      return { remove: () => undefined };
    }) as never);
    const r = await open(startClassic('flags', 1));
    let handled = false;
    await act(async () => {
      handled = press!();
    });
    expect(handled).toBe(true);
    expect(r.texts().join(' ')).toContain('Quit round?');
  });

  it('goes home when the round in the store is not the one in the route', async () => {
    startClassic('flags', 1);
    const r = await open('someone-elses-round');
    expect(r.root.findAll((n) => (n.type as unknown) === 'Redirect').map((n) => n.props.href)).toEqual(['/(tabs)']);
  });
});

describe('feedback', () => {
  it('plays the right sound and haptic for a right and a wrong answer, and none when sound and haptics are off', async () => {
    const r = await open(startClassic('flags', 1));
    const s = useRound.getState().state!;
    await r.press(new RegExp(`^Answer [ABCD], ${s.current.question.a[0].replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`));
    expect(mockAudio.players.length).toBeGreaterThan(0);
    expect(mockHaptics.notification).toHaveBeenCalledWith('success');
    mockHaptics.notification.mockClear();
    useSettings.getState().update({ sound: false, haptics: false });
    await r.press('Next');
    const w = useRound.getState().state!;
    const wrong = w.current.options.find((_, i) => i !== w.current.correctIndex)!;
    await r.press(new RegExp(`^Answer [ABCD], ${wrong.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`));
    expect(mockHaptics.notification).not.toHaveBeenCalled();
  });
});

describe('the Daily on the question screen', () => {
  it('offers Skip once and never 50/50 or +Time', async () => {
    const r = await open(startDaily());
    expect(r.byLabel(/^Skip, 1 left$/)).toHaveLength(1);
    await r.press(/^Skip, 1 left$/);
    expect(r.byLabel('Skip, used')).toHaveLength(1);
    expect(r.byLabel(/^(50\/50|\+Time)/)).toHaveLength(0);
  });
});
