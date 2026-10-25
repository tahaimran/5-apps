/**
 * Fixes from a review of the redesign: the board never moves under a selecting finger, long titles
 * stay in two lines, whole settings rows are switches, choices stack at large text, tab labels follow
 * the letter size, and a slow press on the grid still counts.
 */
import { mockGestures, mockParams } from '@/testing/mocks';
import { resetApp } from '@/testing/stores';
import { cleanup, flush, render } from '@/testing/ui';
import { act } from 'react';
import { StyleSheet } from 'react-native';
import { ThemeProvider } from '@shared/theme';
import { sharedStore } from '@shared/storage';
import '@/bootstrap';
import { wordCells } from '@/domain/generator';
import { cellSizeFor } from '@/domain/gridSize';
import { cellCenter } from '@/domain/selection';
import { useGame } from '@/store/game';
import { useSettings } from '@/store/settings';
import { fontScaleFor, tabBarHeight, tabLabelSize, themeProps } from '@/theme/tokens';
import { ChoiceGroup } from '@/ui/Choice';
import { Ribbon } from '@/ui/Ribbon';
import { SettingsGroup, SwitchRow } from '@/ui/SettingsRow';
import Play from '../../app/play/[puzzleId]';

const wrap = (el: React.ReactElement, scale = 1.25) => (
  <ThemeProvider {...themeProps} fontScale={scale}>
    {el}
  </ThemeProvider>
);

beforeEach(() => resetApp());
afterEach(async () => {
  await cleanup();
  sharedStore.remove('theme.mode');
});

describe('the Game screen at large text', () => {
  it('keeps the word bubble slot the same height with and without letters, so the board never moves mid-drag', async () => {
    mockParams.current = { puzzleId: 'animals:easy:1' };
    jest.useFakeTimers({ doNotFake: ['nextTick', 'setImmediate'] });
    try {
      useSettings.getState().update({ textSize: 'huge' });
      const ui = await render(wrap(<Play />, fontScaleFor('huge')));
      await act(async () => {
        jest.advanceTimersByTime(10);
      });
      await flush();
      const slot = () => ui.root.findAll((n) => typeof n.type === 'string' && n.props.accessibilityElementsHidden === true && StyleSheet.flatten(n.props.style)?.height !== undefined)[0];
      const before = StyleSheet.flatten(slot().props.style).height;
      const game = useGame.getState().current!;
      const size = game.puzzle.size;
      const cell = cellSizeFor(size, require('react-native').Dimensions.get('window').width);
      const first = wordCells(game.puzzle.words[0], size)[0];
      const c = cellCenter({ row: Math.floor(first / size), col: first % size }, cell);
      await act(async () => mockGestures.tap.onEnd!({ x: c.x, y: c.y }, true));
      expect(ui.texts()).toContain(game.puzzle.grid[Math.floor(first / size)][first % size]);
      expect(StyleSheet.flatten(slot().props.style).height).toBe(before);
    } finally {
      jest.useRealTimers();
    }
  });

  it('keeps a long ribbon title to two lines, shrinking rather than cutting it', async () => {
    const ui = await render(wrap(<Ribbon title="Holidays · Level 128" size="sm" />, fontScaleFor('huge')));
    const text = ui.root.findAll((n) => n.props.numberOfLines !== undefined && typeof n.type === 'string')[0];
    expect(text.props.numberOfLines).toBe(2);
    expect(text.props.adjustsFontSizeToFit).toBe(true);
    expect(text.props.ellipsizeMode).toBeUndefined();
  });

  it('accepts a slow, careful press on a letter (longer than the 500 ms default)', () => {
    // Recorded by the gesture stand-in: Grid sets maxDuration on its tap.
    const src = require('fs').readFileSync(require('path').resolve(__dirname, '../components/Grid.tsx'), 'utf8') as string;
    expect(src).toMatch(/Gesture\.Tap\(\)\s*\.maxDuration\((\d+)\)/);
    expect(Number(/maxDuration\((\d+)\)/.exec(src)![1])).toBeGreaterThanOrEqual(1500);
  });
});

describe('settings at large text', () => {
  it('makes the whole row the switch (a 64dp target), says On/Off, and toggles on a tap anywhere', async () => {
    const onChange = jest.fn();
    const ui = await render(
      wrap(
        <SettingsGroup>
          <SwitchRow label="Sounds" value={false} onChange={onChange} />
        </SettingsGroup>,
      ),
    );
    const row = ui.root.findAll((n) => n.props.accessibilityRole === 'switch' && typeof n.props.onPress === 'function')[0];
    expect(row.props.accessibilityState).toEqual({ checked: false });
    expect(ui.texts()).toContain('Off');
    await act(async () => row.props.onPress());
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it('stacks choices as cards once the letter size makes a segmented row too tight', async () => {
    const options = [
      { value: 'phone', label: 'Phone' },
      { value: '12h', label: '12-hour' },
      { value: '24h', label: '24-hour' },
    ];
    const ui = await render(wrap(<ChoiceGroup options={options} value="phone" onChange={() => undefined} />, fontScaleFor('huge')));
    expect(ui.root.findAll((n) => n.props.accessibilityRole === 'radio' && typeof n.type === 'string').length).toBeGreaterThanOrEqual(3);
    // Every label is shown whole (no one-line truncation).
    expect(ui.root.findAll((n) => n.props.numberOfLines === 1 && typeof n.type === 'string')).toHaveLength(0);
  });
});

describe('tab bar', () => {
  it('grows its labels with the letter size, and its height with them', () => {
    expect(tabLabelSize('huge')).toBeGreaterThan(tabLabelSize('comfortable'));
    expect(tabLabelSize('large')).toBe(Math.round(13 * fontScaleFor('large')) + 2);
    expect(tabBarHeight(1, 'huge')).toBeGreaterThan(tabBarHeight(1, 'comfortable'));
    expect(tabBarHeight(2, 'large')).toBeGreaterThan(tabBarHeight(1, 'large'));
    expect(tabBarHeight(1, 'comfortable')).toBeGreaterThanOrEqual(56);
  });
});
