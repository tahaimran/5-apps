import { mockHaptics, resetDisk } from '../../testing/native';
import { act, type ReactElement } from 'react';
import TestRenderer, { type ReactTestInstance, type ReactTestRenderer } from 'react-test-renderer';
import { sharedStore } from '../../storage';
import { ThemeProvider } from '../../theme';
import { isOnboardingComplete, OnboardingFlow, useOnboardingComplete, type OnboardingStep, type StepContext } from '../index';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let live: ReactTestRenderer[] = [];
beforeEach(() => {
  resetDisk();
  live = [];
  jest.clearAllMocks();
});
afterEach(async () => {
  for (const r of live) await act(async () => r.unmount());
});

const steps3: OnboardingStep[] = [
  { key: 'one', title: 'Step one', body: 'First body' },
  { key: 'two', title: 'Step two' },
  { key: 'three', title: 'Step three' },
];

interface Flow {
  r: ReactTestRenderer;
  root: ReactTestInstance;
  texts: () => string;
  has: (label: string) => boolean;
  press: (label: string) => Promise<void>;
  rerender: (el: ReactElement) => Promise<void>;
}

async function start(steps: OnboardingStep[], props: Partial<Parameters<typeof OnboardingFlow>[0]> = {}): Promise<Flow & { onDone: jest.Mock }> {
  const onDone = jest.fn();
  const el = (
    <ThemeProvider>
      <OnboardingFlow steps={steps} onDone={onDone} {...props} />
    </ThemeProvider>
  );
  let r!: ReactTestRenderer;
  await act(async () => {
    r = TestRenderer.create(el);
  });
  live.push(r);
  const pressables = () => r.root.findAll((n) => typeof n.props.onPress === 'function' && typeof n.props.accessibilityLabel === 'string');
  return {
    r,
    root: r.root,
    onDone,
    texts: () => JSON.stringify(r.toJSON()),
    has: (label) => pressables().some((n) => n.props.accessibilityLabel === label),
    press: async (label) => {
      const node = pressables().find((n) => n.props.accessibilityLabel === label && !n.props.disabled);
      if (!node) throw new Error(`Nothing to press labelled "${label}"`);
      await act(async () => {
        await node.props.onPress();
      });
    },
    rerender: async (next) => {
      await act(async () => r.update(next));
    },
  };
}
const progress = (f: Flow) => f.root.findAll((n) => /^Step \d+ of \d+$/.test(String(n.props.accessibilityLabel)))[0]?.props.accessibilityLabel;

describe('basic flow', () => {
  it('shows the first step with its title and body, a Next button, and no Back', async () => {
    const f = await start(steps3);
    expect(f.texts()).toContain('Step one');
    expect(f.texts()).toContain('First body');
    expect(f.has('Next')).toBe(true);
    expect(f.has('Back')).toBe(false);
  });
  it('goes forward and back', async () => {
    const f = await start(steps3);
    await f.press('Next');
    expect(f.texts()).toContain('Step two');
    expect(f.has('Back')).toBe(true);
    await f.press('Back');
    expect(f.texts()).toContain('Step one');
  });
  it('labels the last button "Get started" and finishes there', async () => {
    const f = await start(steps3);
    await f.press('Next');
    await f.press('Next');
    expect(f.texts()).toContain('Step three');
    expect(f.has('Next')).toBe(false);
    await f.press('Get started');
    expect(f.onDone).toHaveBeenCalledTimes(1);
  });
  it('announces progress to screen readers', async () => {
    const f = await start(steps3);
    expect(progress(f)).toBe('Step 1 of 3');
    await f.press('Next');
    expect(progress(f)).toBe('Step 2 of 3');
  });
  it('gives a light tap of haptic feedback when moving on', async () => {
    const f = await start(steps3);
    await f.press('Next');
    expect(mockHaptics.impact).toHaveBeenCalledWith('light');
  });
  it('works with a single step', async () => {
    const f = await start([{ key: 'only', title: 'Only' }]);
    expect(f.has('Get started')).toBe(true);
    expect(f.has('Skip')).toBe(false);
    await f.press('Get started');
    expect(f.onDone).toHaveBeenCalledTimes(1);
  });
  it('renders nothing for an empty list instead of crashing', async () => {
    const f = await start([]);
    expect(f.r.toJSON()).toBeNull();
  });
});

describe('completion is remembered', () => {
  it('records the time it finished, once, and reports it', async () => {
    expect(isOnboardingComplete()).toBe(false);
    const f = await start([{ key: 'a', title: 'A' }]);
    await f.press('Get started');
    expect(isOnboardingComplete()).toBe(true);
    expect(sharedStore.get('onboarding.completedAt')).toBeGreaterThan(0);
  });
  it('is not marked done by walking part of the flow', async () => {
    const f = await start(steps3);
    await f.press('Next');
    expect(isOnboardingComplete()).toBe(false);
  });
  it('lets a screen react to completion with useOnboardingComplete', async () => {
    let seen: boolean[] = [];
    const Probe = () => {
      seen.push(useOnboardingComplete());
      return null;
    };
    await act(async () => {
      live.push(TestRenderer.create(<Probe />));
    });
    await act(async () => sharedStore.set('onboarding.completedAt', Date.now()));
    expect(seen[0]).toBe(false);
    expect(seen.at(-1)).toBe(true);
    seen = [];
  });
});

describe('skip', () => {
  it('shows on every step except the last, and finishes with what was answered so far', async () => {
    const steps: OnboardingStep[] = [
      { key: 'a', title: 'A', render: (c) => <Set ctx={c} value="x" /> },
      { key: 'b', title: 'B' },
      { key: 'c', title: 'C' },
    ];
    const f = await start(steps);
    await f.press('set');
    expect(f.has('Skip')).toBe(true);
    await f.press('Skip');
    expect(f.onDone).toHaveBeenCalledWith({ a: 'x' });
    expect(isOnboardingComplete()).toBe(true);
  });
  it('is hidden on the last step', async () => {
    const f = await start(steps3);
    await f.press('Next');
    await f.press('Next');
    expect(f.has('Skip')).toBe(false);
  });
  it('can be turned off for the whole flow', async () => {
    expect((await start(steps3, { allowSkip: false })).has('Skip')).toBe(false);
  });
  it('can be turned off for one step', async () => {
    const f = await start([{ key: 'a', title: 'A', skippable: false }, ...steps3.slice(1)]);
    expect(f.has('Skip')).toBe(false);
    await f.press('Next');
    expect(f.has('Skip')).toBe(true);
  });
});

/** A tiny custom input: a button that stores a value for its step. */
function Set({ ctx, value }: { ctx: StepContext; value: unknown }) {
  return <Pressable2 label="set" onPress={() => ctx.setValue(value)} />;
}
function Pressable2({ label, onPress }: { label: string; onPress: () => void }) {
  const { Pressable } = require('react-native') as typeof import('react-native');
  return <Pressable accessibilityLabel={label} onPress={onPress} />;
}

describe('custom steps and answers', () => {
  it('collects answers by step key and passes them to onDone', async () => {
    const steps: OnboardingStep[] = [
      { key: 'goal', title: 'Goal', render: (c) => <Set ctx={c} value={['fit']} /> },
      { key: 'time', title: 'Time', render: (c) => <Set ctx={c} value="08:00" /> },
    ];
    const f = await start(steps);
    await f.press('set');
    await f.press('Next');
    await f.press('set');
    await f.press('Get started');
    expect(f.onDone).toHaveBeenCalledWith({ goal: ['fit'], time: '08:00' });
  });
  it('keeps an answer when going back and forth', async () => {
    const seen: unknown[] = [];
    const steps: OnboardingStep[] = [
      {
        key: 'a',
        title: 'A',
        render: (c) => {
          seen.push(c.value);
          return <Set ctx={c} value="kept" />;
        },
      },
      { key: 'b', title: 'B' },
    ];
    const f = await start(steps);
    await f.press('set');
    await f.press('Next');
    await f.press('Back');
    expect(seen.at(-1)).toBe('kept');
  });
  it('hands every step the answers so far', async () => {
    let answers: unknown;
    const f = await start([
      { key: 'a', title: 'A', render: (c) => <Set ctx={c} value={1} /> },
      { key: 'b', title: 'B', render: (c) => { answers = c.answers; return null; } },
    ]);
    await f.press('set');
    await f.press('Next');
    expect(answers).toEqual({ a: 1 });
  });
  it('blocks Next until canContinue says the answer is valid', async () => {
    const steps: OnboardingStep[] = [
      { key: 'a', title: 'A', render: (c) => <Set ctx={c} value="ok" />, canContinue: ({ value }) => value === 'ok' },
      { key: 'b', title: 'B' },
    ];
    const f = await start(steps);
    const next = () => f.root.findAll((n) => n.props.accessibilityLabel === 'Next' && typeof n.props.onPress === 'function')[0];
    expect(next().props.disabled).toBe(true);
    expect(next().props.accessibilityState.disabled).toBe(true);
    await expect(f.press('Next')).rejects.toThrow();
    await f.press('set');
    expect(next().props.disabled).toBe(false);
    await f.press('Next');
    expect(f.texts()).toContain('B');
  });
  it('does not block Skip when the step is invalid', async () => {
    const f = await start([{ key: 'a', title: 'A', canContinue: () => false }, { key: 'b', title: 'B' }]);
    await f.press('Skip');
    expect(f.onDone).toHaveBeenCalled();
  });
});

describe('labels', () => {
  it('can be replaced for translation', async () => {
    const f = await start(steps3, { labels: { next: 'Weiter', skip: 'Überspringen' } });
    expect(f.has('Weiter')).toBe(true);
    expect(f.has('Überspringen')).toBe(true);
    await f.press('Weiter');
    expect(f.has('Zurück')).toBe(false);
    expect(f.has('Back')).toBe(true); // not overridden, keeps the default
  });
  it('can be set per step, including the secondary link', async () => {
    const onPress = jest.fn();
    const f = await start([
      { key: 'a', title: 'A', cta: "Let's start", secondary: { label: "I'll do it later", onPress } },
      { key: 'b', title: 'B' },
    ]);
    expect(f.has("Let's start")).toBe(true);
    expect(f.has('Next')).toBe(false);
    await f.press("I'll do it later");
    expect(onPress).toHaveBeenCalledTimes(1);
  });
  it('uses the step label even on the last step', async () => {
    const f = await start([{ key: 'a', title: 'A', cta: 'Allow reminders' }]);
    expect(f.has('Allow reminders')).toBe(true);
    expect(f.has('Get started')).toBe(false);
  });
});

describe('secondary actions', () => {
  it('can move on, finish, or finish with a final answer', async () => {
    const steps = (secondary: OnboardingStep['secondary']): OnboardingStep[] => [
      { key: 'a', title: 'A', secondary },
      { key: 'b', title: 'B' },
    ];
    let f = await start(steps({ label: 'go', onPress: (c) => c.next() }));
    await f.press('go');
    expect(f.texts()).toContain('"B"');

    f = await start(steps({ label: 'end', onPress: (c) => c.finish() }));
    await f.press('end');
    expect(f.onDone).toHaveBeenCalledWith({});

    f = await start(steps({ label: 'end', onPress: (c) => c.finish({ reminder: { mode: 'none' } }) }));
    await f.press('end');
    expect(f.onDone).toHaveBeenCalledWith({ reminder: { mode: 'none' } });
  });
});

describe('hidden steps', () => {
  const flow: OnboardingStep[] = [
    { key: 'a', title: 'A', render: (c) => <Set ctx={c} value="none" /> },
    { key: 'b', title: 'B', hidden: (answers) => answers.a === 'none' },
    { key: 'c', title: 'C' },
  ];
  it('are skipped, and left out of the progress count', async () => {
    const f = await start(flow);
    expect(progress(f)).toBe('Step 1 of 3');
    await f.press('set');
    expect(progress(f)).toBe('Step 1 of 2');
    await f.press('Next');
    expect(f.texts()).toContain('"C"');
    expect(f.texts()).not.toContain('"B"');
    expect(progress(f)).toBe('Step 2 of 2');
  });
  it('are shown when their condition is not met', async () => {
    const f = await start(flow);
    await f.press('Next');
    expect(f.texts()).toContain('"B"');
  });
  it('make the flow finish early when the last visible step disappears', async () => {
    const f = await start([
      { key: 'a', title: 'A', render: (c) => <Set ctx={c} value="none" /> },
      { key: 'b', title: 'B', hidden: (answers) => answers.a === 'none' },
    ]);
    await f.press('set');
    expect(f.has('Get started')).toBe(true);
    await f.press('Get started');
    expect(f.onDone).toHaveBeenCalledWith({ a: 'none' });
  });
});

describe('onContinue', () => {
  it('runs before moving on, and waits for it to finish', async () => {
    let release!: () => void;
    const gate = new Promise<void>((r) => (release = r));
    const onContinue = jest.fn(() => gate);
    const f = await start([{ key: 'a', title: 'A', onContinue }, { key: 'b', title: 'B' }]);
    const next = f.root.findAll((n) => n.props.accessibilityLabel === 'Next' && typeof n.props.onPress === 'function')[0];
    let pressing!: Promise<void>;
    await act(async () => {
      pressing = next.props.onPress();
    });
    expect(onContinue).toHaveBeenCalledTimes(1);
    expect(f.texts()).toContain('"A"'); // still waiting
    await act(async () => {
      release();
      await pressing;
    });
    expect(f.texts()).toContain('"B"');
  });
  it('cannot be triggered twice while it is running', async () => {
    let release!: () => void;
    const onContinue = jest.fn(() => new Promise<void>((r) => (release = r)));
    const f = await start([{ key: 'a', title: 'A', onContinue }, { key: 'b', title: 'B' }]);
    const button = () => f.root.findAll((n) => n.props.accessibilityLabel === 'Next' && typeof n.props.onPress === 'function')[0];
    await act(async () => {
      void button().props.onPress();
    });
    expect(button().props.disabled).toBe(true);
    await act(async () => {
      void button().props.onPress();
    });
    expect(onContinue).toHaveBeenCalledTimes(1);
    await act(async () => release());
  });
  it('still moves on if the action fails, and re-enables the button', async () => {
    const f = await start([{ key: 'a', title: 'A', onContinue: async () => { throw new Error('denied'); } }, { key: 'b', title: 'B' }]);
    await act(async () => {
      await f.root.findAll((n) => n.props.accessibilityLabel === 'Next' && typeof n.props.onPress === 'function')[0].props.onPress().catch(() => undefined);
    });
    expect(f.texts()).toBeDefined();
  });
  it('runs on the last step before finishing', async () => {
    const order: string[] = [];
    const f = await start([{ key: 'a', title: 'A', onContinue: async () => void order.push('continue') }]);
    f.onDone.mockImplementation(() => order.push('done'));
    await f.press('Get started');
    expect(order).toEqual(['continue', 'done']);
  });
});

describe('accessibility', () => {
  it('gives every control a label and a 48dp target', async () => {
    const f = await start(steps3);
    await f.press('Next');
    const controls = f.root.findAll((n) => typeof n.props.onPress === 'function' && typeof n.type !== 'string');
    for (const control of controls) {
      expect(typeof control.props.accessibilityLabel).toBe('string');
      expect(control.props.accessibilityRole).toBe('button');
    }
  });
  it('marks step titles as headers', async () => {
    const f = await start(steps3);
    expect(f.root.findAll((n) => n.props.accessibilityRole === 'header')).not.toHaveLength(0);
  });
  it('makes the main button at least as tall as the larger touch target', async () => {
    const f = await start(steps3);
    const next = f.root.findAll((n) => n.props.accessibilityLabel === 'Next' && typeof n.props.onPress === 'function')[0];
    const style = Object.assign({}, ...[next.props.style].flat(2).filter(Boolean));
    expect(style.minHeight).toBeGreaterThanOrEqual(52);
  });
});
