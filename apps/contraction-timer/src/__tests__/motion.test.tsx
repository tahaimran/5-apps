/**
 * Motion (plan §7, expo-animation): every animated path renders with Reduce Motion off, effects the user
 * causes finish in under 300 ms, the breathing ring is the one slow loop (and still under Reduce Motion),
 * and the right Reanimated tool is used for each.
 */
import { mockMotion } from '@/testing/mocks';
import { resetApp } from '@/testing/stores';
import { cleanup, render } from '@/testing/ui';
import { StyleSheet } from 'react-native';
import type { ReactTestInstance } from 'react-test-renderer';
import { ThemeProvider } from '@shared/theme';
import { sharedStore } from '@shared/storage';
import '@/bootstrap';
import { useKicks } from '@/store/kicks';
import { useMeta } from '@/store/meta';
import { useSessions } from '@/store/sessions';
import { FONT_SCALE, themeProps } from '@/theme/tokens';
import { BREATH, BREATH_MS, FILL_MS, KICK_POP, POP_MS, RISE_IN, RISE_MS, STATE_MS, WASH_MS } from '@/ui/motion';
import { AlertCard } from '@/ui/AlertCard';
import TimerScreen from '../../app/(tabs)/timer/index';
import Kicks from '../../app/(tabs)/kicks/index';
import Info from 'lucide-react-native/icons/info';

const wrap = (el: React.ReactElement) => (
  <ThemeProvider {...themeProps} fontScale={FONT_SCALE}>
    {el}
  </ThemeProvider>
);

/** Every flattened host style in the tree. */
const styles = (root: ReactTestInstance) =>
  root
    .findAll((n) => typeof n.type === 'string')
    .map((n) => StyleSheet.flatten(n.props.style) as Record<string, unknown> | undefined)
    .filter((s): s is Record<string, unknown> => !!s);
const keyframed = (root: ReactTestInstance) => styles(root).filter((s) => 'animationName' in s);

beforeEach(() => {
  resetApp();
  sharedStore.set('onboarding.completedAt', 1);
  useMeta.getState().update({ disclaimerAckAt: 1, coachMarkShownAt: 1 });
  mockMotion.reduced = false;
});
afterEach(async () => {
  mockMotion.reduced = true;
  await cleanup();
  sharedStore.remove('onboarding.completedAt');
});

describe('motion tokens', () => {
  it('keeps every effect the user causes under 300 ms', () => {
    for (const ms of [STATE_MS, FILL_MS, WASH_MS, POP_MS, RISE_MS]) expect(ms).toBeLessThan(300);
  });
  it('breathes 4 s in and 4 s out, from a still ring (never from nothing)', () => {
    expect(BREATH_MS).toBe(4000);
    expect(BREATH['50%'].transform[0].scale).toBeGreaterThan(1);
    expect(BREATH['0%'].transform[0].scale).toBe(1);
    expect(BREATH['0%'].opacity).toBeGreaterThan(0);
  });
  it('pops a counted kick from full size, and has two copies so each tap replays it', () => {
    expect(KICK_POP).toHaveLength(2);
    expect(KICK_POP[0]['0%'].transform[0].scale).toBe(1);
    expect(KICK_POP[0]).not.toBe(KICK_POP[1]);
  });
});

describe('the Timer with Reduce Motion off', () => {
  it('breathes the ring while a contraction runs: one looping keyframe, 8 s a breath', async () => {
    useSessions.getState().tap(Date.now() - 5_000);
    const ui = await render(wrap(<TimerScreen />));
    const loops = keyframed(ui.root).filter((s) => s.animationName === BREATH);
    expect(loops).toHaveLength(1);
    expect(loops[0]).toMatchObject({ animationDuration: 2 * BREATH_MS, animationIterationCount: 'infinite' });
    // The button fill and the page wash change with short CSS transitions, not shared values.
    expect(styles(ui.root).filter((s) => s.transitionProperty === 'opacity' && s.transitionDuration === FILL_MS)).toHaveLength(1);
    expect(styles(ui.root).filter((s) => s.transitionProperty === 'opacity' && s.transitionDuration === WASH_MS)).toHaveLength(1);
  });
  it('has no ring at rest', async () => {
    const ui = await render(wrap(<TimerScreen />));
    expect(keyframed(ui.root).filter((s) => s.animationName === BREATH)).toHaveLength(0);
  });
  it('draws the ring still under Reduce Motion, and the colors change at once', async () => {
    mockMotion.reduced = true;
    useSessions.getState().tap(Date.now() - 5_000);
    const ui = await render(wrap(<TimerScreen />));
    expect(keyframed(ui.root)).toHaveLength(0);
    expect(styles(ui.root).filter((s) => s.transitionProperty === 'opacity').every((s) => s.transitionDuration === 0)).toBe(true);
  });
});

describe('the Kicks counter', () => {
  it('pops the number on each counted movement, alternating names so it replays', async () => {
    useKicks.getState().start(Date.now() - 60_000);
    useKicks.getState().tap(Date.now() - 30_000);
    const ui = await render(wrap(<Kicks />));
    const pops = keyframed(ui.root).filter((s) => KICK_POP.includes(s.animationName as (typeof KICK_POP)[number]));
    expect(pops).toHaveLength(1);
    expect(pops[0]).toMatchObject({ animationName: KICK_POP[1], animationDuration: POP_MS });
  });
  it('does not pop under Reduce Motion', async () => {
    mockMotion.reduced = true;
    useKicks.getState().start(Date.now() - 60_000);
    useKicks.getState().tap(Date.now() - 30_000);
    const ui = await render(wrap(<Kicks />));
    expect(keyframed(ui.root)).toHaveLength(0);
  });
});

describe('the calm amber card', () => {
  it('rises in once (a one-shot keyframe), and is simply there under Reduce Motion', async () => {
    const ui = await render(wrap(<AlertCard icon={Info}>Heads up</AlertCard>));
    expect(keyframed(ui.root)).toEqual([expect.objectContaining({ animationName: RISE_IN, animationDuration: RISE_MS })]);
    await cleanup();
    mockMotion.reduced = true;
    const still = await render(wrap(<AlertCard icon={Info}>Heads up</AlertCard>));
    expect(keyframed(still.root)).toHaveLength(0);
  });
});
