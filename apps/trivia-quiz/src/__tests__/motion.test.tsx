/**
 * Motion (plan §7, expo-animation): every animated path renders with Reduce Motion off, each effect is
 * under 300 ms, the right Reanimated tool is used for each, and Reduce Motion drops the movement.
 */
import '@/testing/stores';
import React from 'react';
import { StyleSheet } from 'react-native';
import { act } from 'react';
import type { ReactTestInstance } from 'react-test-renderer';
import { mockMotion, mockParams } from '@/testing/mocks';
import { cleanup, render } from '@/testing/ui';
import { resetApp } from '@/testing/stores';
import { startCategory } from '@/features/play/start';
import { useRound } from '@/store/round';
import { useClassic } from '@/store/stores';
import { POP, SHAKE, SHAKE_MS, STAR_GAP_MS, STAR_POP, PING, PING_MS, STATE_MS } from '@/ui/motion';
import { StarRow } from '@/ui/StarRow';
import Quiz from '../../app/quiz/[sessionId]';
import ClassicMap from '../../app/classic/[category]';

beforeEach(() => {
  resetApp();
  mockMotion.reduced = false;
});
afterEach(async () => {
  mockMotion.reduced = true;
  await cleanup();
});

/** Every flattened style in the tree that carries a CSS animation. */
const animated = (root: ReactTestInstance) =>
  root
    .findAll((n) => typeof n.type === 'string')
    .map((n) => StyleSheet.flatten(n.props.style) as Record<string, unknown> | undefined)
    .filter((s): s is Record<string, unknown> => !!s && 'animationName' in s);

describe('motion tokens', () => {
  it('keeps every effect the user causes under 300 ms (plan §7: 240 ms shake, stars 150 ms apart)', () => {
    expect(SHAKE_MS).toBe(240);
    expect(STATE_MS).toBeLessThan(300);
    expect(STAR_GAP_MS).toBe(150);
    // The halo pings in its first 18% (under 300 ms) and rests for the rest of the cycle.
    expect(PING_MS * 0.18).toBeLessThan(300);
    expect(Object.keys(PING)).toContain('18%');
  });
  it('shakes three times, bounces once and pops the stars from 0.6 (never from 0)', () => {
    const xs = Object.values(SHAKE).map((k) => k.transform[0].translateX);
    expect(xs.filter((v) => v < 0)).toHaveLength(3);
    expect(xs[0]).toBe(0);
    expect(xs[xs.length - 1]).toBe(0);
    expect(POP['100%'].transform[0].scale).toBe(1);
    expect(STAR_POP['0%'].transform[0].scale).toBeGreaterThan(0.5);
  });
});

describe('the quiz screen with Reduce Motion off', () => {
  it('shakes a wrong answer and bounces the right one, both as one-shot CSS keyframes', async () => {
    mockParams.current = { sessionId: startCategory('science', 2)! };
    const r = await render(<Quiz />);
    const s = useRound.getState().state!;
    const wrong = [0, 1, 2, 3].find((i) => i !== s.current.correctIndex)!;
    await r.press(new RegExp(`^Answer ${'ABCD'[wrong]}, `));
    const styles = animated(r.root);
    expect(styles.some((st) => st.animationName === SHAKE && st.animationDuration === SHAKE_MS)).toBe(true);
    expect(styles.some((st) => st.animationName === POP)).toBe(true);
    // The verdict never relies on color: the labels say which is which.
    expect(r.byLabel(/, correct$/)).toHaveLength(1);
    expect(r.byLabel(/, wrong$/)).toHaveLength(1);
  });

  it('beats the timer number in the last five seconds', async () => {
    mockParams.current = { sessionId: startCategory('science', 2)! };
    const r = await render(<Quiz />);
    await act(async () => useRound.getState().apply((st) => ({ ...st, msLeft: 4_000 })));
    expect(animated(r.root).some((st) => st.animationDuration === '220ms')).toBe(true);
    expect(r.byLabel('About 5 seconds left')).toHaveLength(1);
  });

  it('drops the shake under Reduce Motion (only the colors change)', async () => {
    mockMotion.reduced = true;
    mockParams.current = { sessionId: startCategory('science', 2)! };
    const r = await render(<Quiz />);
    const s = useRound.getState().state!;
    const wrong = [0, 1, 2, 3].find((i) => i !== s.current.correctIndex)!;
    await r.press(new RegExp(`^Answer ${'ABCD'[wrong]}, `));
    expect(animated(r.root)).toHaveLength(0);
  });
});

describe('stars and the level map', () => {
  it('pops earned stars one after another, 150 ms apart', async () => {
    const r = await render(<StarRow stars={3} pop />);
    const delays = animated(r.root).map((st) => st.animationDelay);
    expect(delays).toEqual(['120ms', `${120 + STAR_GAP_MS}ms`, `${120 + 2 * STAR_GAP_MS}ms`]);
  });
  it('pings a halo around the current level, and nothing under Reduce Motion', async () => {
    useClassic.getState().set({});
    mockParams.current = { category: 'history' };
    const r = await render(<ClassicMap />);
    expect(animated(r.root).filter((st) => st.animationName === PING)).toHaveLength(1);
    await cleanup();
    mockMotion.reduced = true;
    const quiet = await render(<ClassicMap />);
    expect(animated(quiet.root).filter((st) => st.animationName === PING)).toHaveLength(0);
  });
});
