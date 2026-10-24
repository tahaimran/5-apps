import { mockHaptics, mockLocale, resetDisk } from '../../testing/native';
import { act } from 'react';
import { ScrollView, Text } from 'react-native';
import type { ReactTestInstance } from 'react-test-renderer';
import { cleanup, render } from '../../testing/render';
import { ThemeProvider } from '../../theme';
import { currentTimeFormat, formatClock, setTimeFormatPreference, TimeField, useTimeFormat } from '../index';

const themed = (el: React.ReactElement) => <ThemeProvider>{el}</ThemeProvider>;

beforeEach(() => {
  resetDisk();
  mockLocale.uses24hourClock = true;
  setTimeFormatPreference(undefined);
});
afterEach(cleanup);

function Probe() {
  const clock = useTimeFormat();
  return (
    <Text>
      {clock.format}|{clock.time('20:30')}|{clock.hour(9)}|{clock.at(new Date(2026, 0, 1, 7, 5))}
    </Text>
  );
}

describe('useTimeFormat', () => {
  it('follows the phone clock until the user picks a style', async () => {
    mockLocale.uses24hourClock = false;
    const ui = await render(<Probe />);
    expect(ui.texts()[0]).toBe('12h|8:30 PM|9 AM|7:05 AM');
    await act(async () => setTimeFormatPreference('24h'));
    expect(ui.texts()[0]).toBe('24h|20:30|09:00|07:05');
    expect(currentTimeFormat()).toBe('24h');
  });

  it('formats a Date outside React in the current style', () => {
    setTimeFormatPreference('12h');
    expect(formatClock(new Date(2026, 0, 1, 14, 30))).toBe('2:30 PM');
    expect(formatClock(new Date(2026, 0, 1, 14, 30), '24h')).toBe('14:30');
  });
});

const scrollViews = (root: ReactTestInstance) => root.findAll((n) => n.type === ScrollView);
const wheel = (root: ReactTestInstance, label: string) => root.findAll((n) => typeof n.type === 'string' && n.props.accessibilityRole === 'adjustable' && n.props.accessibilityLabel === label)[0];
const scrollTo = (sv: ReactTestInstance, y: number) => {
  const e = { nativeEvent: { contentOffset: { y } } };
  sv.props.onScroll(e);
  sv.props.onMomentumScrollEnd(e);
};

describe('TimeField', () => {
  it('shows the stored time in 24-hour style and saves a wheel pick', async () => {
    const onChange = jest.fn();
    const ui = await render(themed(<TimeField label="Wake up" value="07:00" onChange={onChange} />));
    await ui.press('Wake up, 07:00');
    const [hours, minutes] = scrollViews(ui.root);
    mockHaptics.selection.mockClear();
    await act(async () => {
      scrollTo(hours, 48 * 8); // 08
      scrollTo(minutes, 48 * 6); // 30
    });
    expect(mockHaptics.selection).toHaveBeenCalled();
    expect(ui.texts()).toContain('08:30');
    await ui.press('Done');
    expect(onChange).toHaveBeenCalledWith('08:30');
  });

  it('adds an AM/PM wheel in 12-hour style and keeps the hour in 24-hour form', async () => {
    setTimeFormatPreference('12h');
    const onChange = jest.fn();
    const ui = await render(themed(<TimeField label="Bedtime" value="10:15" onChange={onChange} />));
    await ui.press('Bedtime, 10:15 AM');
    expect(scrollViews(ui.root)).toHaveLength(3);
    await act(async () => scrollTo(scrollViews(ui.root)[2], 48)); // PM
    await act(async () => scrollTo(scrollViews(ui.root)[0], 48 * 11)); // 11
    await ui.press('Done');
    expect(onChange).toHaveBeenCalledWith('23:15');
  });

  it('steps with TalkBack actions and supports exact minutes', async () => {
    const onChange = jest.fn();
    const ui = await render(themed(<TimeField label="Time" value="14:07" minuteStep={1} onChange={onChange} />));
    await ui.press('Time, 14:07');
    await act(async () => wheel(ui.root, 'Minute').props.onAccessibilityAction({ nativeEvent: { actionName: 'increment' } }));
    await act(async () => wheel(ui.root, 'Hour').props.onAccessibilityAction({ nativeEvent: { actionName: 'decrement' } }));
    // Settling on the value already selected changes nothing.
    await act(async () => scrollTo(scrollViews(ui.root)[0], 48 * 13));
    await ui.press('Done');
    expect(onChange).toHaveBeenCalledWith('13:08');
  });

  it('closes without saving from the scrim', async () => {
    const onChange = jest.fn();
    const ui = await render(themed(<TimeField label="Wake up" value="07:00" onChange={onChange} />));
    await ui.press('Wake up, 07:00');
    await ui.press('Close');
    expect(ui.byLabel('Hour')).toHaveLength(0);
    expect(onChange).not.toHaveBeenCalled();
  });
});
