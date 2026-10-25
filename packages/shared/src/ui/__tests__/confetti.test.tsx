import { resetDisk } from '../../testing/native';
import { act } from 'react';
import * as Reanimated from 'react-native-reanimated';
import { cleanup, render } from '../../testing/render';
import { Confetti, confettiPieces } from '../index';

const COLORS = ['#111111', '#222222', '#333333'];

beforeEach(() => {
  resetDisk();
  jest.useFakeTimers();
});
afterEach(async () => {
  jest.restoreAllMocks();
  await cleanup();
  jest.useRealTimers();
});

describe('confettiPieces', () => {
  it('uses the colors in turn and stays inside the screen width', () => {
    const pieces = confettiPieces(9, 400, COLORS);
    expect(pieces.map((p) => p.color)).toEqual([...COLORS, ...COLORS, ...COLORS]);
    for (const p of pieces) {
      expect(p.x).toBeGreaterThanOrEqual(0);
      expect(p.x).toBeLessThanOrEqual(400);
      expect(p.size).toBeGreaterThanOrEqual(8);
    }
  });
  it('is the same burst every time (no randomness in render)', () => {
    expect(confettiPieces(20, 360, COLORS)).toEqual(confettiPieces(20, 360, COLORS));
  });
  it('never paints an undefined color', () => {
    expect(confettiPieces(3, 300, []).every((p) => p.color === '#FFFFFF')).toBe(true);
  });
});

describe('Confetti', () => {
  it('draws nothing under Reduce Motion and is done at once', async () => {
    const onDone = jest.fn();
    const ui = await render(<Confetti colors={COLORS} onDone={onDone} />);
    expect(ui.root.findAll((n) => n.props.pointerEvents === 'none')).toHaveLength(0);
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it('bursts once, takes no touches, hides from screen readers and reports when done', async () => {
    jest.spyOn(Reanimated, 'useReducedMotion').mockReturnValue(false);
    const onDone = jest.fn();
    const ui = await render(<Confetti colors={COLORS} count={12} duration={1000} onDone={onDone} />);
    const layer = ui.root.findAll((n) => typeof n.type === 'string' && n.props.pointerEvents === 'none')[0];
    expect(layer.props.importantForAccessibility).toBe('no-hide-descendants');
    expect(layer.children).toHaveLength(12);
    expect(onDone).not.toHaveBeenCalled();
    await act(async () => jest.advanceTimersByTime(1000));
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it('stops its timer when it leaves early', async () => {
    jest.spyOn(Reanimated, 'useReducedMotion').mockReturnValue(false);
    const onDone = jest.fn();
    await render(<Confetti colors={COLORS} onDone={onDone} />);
    await cleanup();
    await act(async () => jest.advanceTimersByTime(5000));
    expect(onDone).not.toHaveBeenCalled();
  });
});
