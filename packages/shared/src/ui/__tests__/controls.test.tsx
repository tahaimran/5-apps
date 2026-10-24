import { resetDisk } from '../../testing/native';
import { act } from 'react';
import { Switch } from 'react-native';
import { cleanup, render } from '../../testing/render';
import { defaultPalettes, ThemeProvider, type ThemePreference } from '../../theme';
import { sharedStore } from '../../storage';
import { insetTones, Segmented, Stepper, stepValue, SystemNavBar, Toggle } from '../index';

const themed = (el: React.ReactElement, mode: ThemePreference = 'light') => {
  sharedStore.set('theme.mode', mode);
  return <ThemeProvider>{el}</ThemeProvider>;
};

beforeEach(resetDisk);
afterEach(cleanup);

describe('insetTones', () => {
  it('raises parts above the track: white on grey in light, lighter than the track in dark', () => {
    expect(insetTones(defaultPalettes.light, 'light')).toEqual({ track: defaultPalettes.light.surfaceAlt, raised: defaultPalettes.light.surface });
    expect(insetTones(defaultPalettes.dark, 'dark')).toEqual({ track: defaultPalettes.dark.background, raised: defaultPalettes.dark.surfaceAlt });
  });
});

describe('Toggle', () => {
  it('keeps the off thumb visible in dark mode and reports changes', async () => {
    const onValueChange = jest.fn();
    const ui = await render(themed(<Toggle label="Sounds" value={false} onValueChange={onValueChange} />, 'dark'));
    const sw = ui.root.findByType(Switch);
    expect(sw.props.thumbColor).toBe(defaultPalettes.dark.textMuted);
    expect(sw.props.accessibilityLabel).toBe('Sounds');
    await act(async () => sw.props.onValueChange(true));
    expect(onValueChange).toHaveBeenCalledWith(true);
  });

  it('uses a white thumb in light mode', async () => {
    const ui = await render(themed(<Toggle label="Sounds" value={false} onValueChange={jest.fn()} />));
    expect(ui.root.findByType(Switch).props.thumbColor).toBe('#FFFFFF');
  });
});

describe('Segmented', () => {
  const options = [
    { value: 'day', label: 'Day' },
    { value: 'week', label: 'Week' },
  ] as const;

  it('marks the selected option and slides the pill only after the first layout', async () => {
    const onChange = jest.fn();
    const ui = await render(themed(<Segmented options={[...options]} value="week" onChange={onChange} />));
    const track = ui.root.findAll((n) => n.props.accessibilityRole === 'radiogroup')[0];
    await act(async () => track.props.onLayout({ nativeEvent: { layout: { width: 208 } } }));
    expect(ui.byLabel('Week')[0].props.accessibilityState).toEqual({ selected: true });
    await ui.press('Day');
    expect(onChange).toHaveBeenCalledWith('day');
  });

  it('falls back to the first option for an unknown value', async () => {
    const ui = await render(themed(<Segmented options={[...options]} value={'month' as 'day'} onChange={jest.fn()} />, 'dark'));
    expect(ui.byLabel('Day')[0].props.accessibilityState).toEqual({ selected: false });
  });
});

describe('stepValue', () => {
  it('snaps to the step grid', () => {
    expect(stepValue(237, 50, 1)).toBe(250);
    expect(stepValue(250, 50, 1)).toBe(300);
    expect(stepValue(237, 50, -1)).toBe(200);
    expect(stepValue(250, 50, -1)).toBe(200);
  });
});

describe('Stepper', () => {
  it('steps within bounds with default labels', async () => {
    const onChange = jest.fn();
    const ui = await render(themed(<Stepper label="Goal" value={240} min={100} max={250} step={50} onChange={onChange} format={(v) => `${v} ml`} />));
    expect(ui.byLabel('Goal 240 ml')).toHaveLength(1);
    await ui.press('Increase Goal');
    expect(onChange).toHaveBeenLastCalledWith(250);
    await ui.press('Decrease Goal');
    expect(onChange).toHaveBeenLastCalledWith(200);
  });

  it('disables the ends and accepts a value-dependent step', async () => {
    const onChange = jest.fn();
    const step = (v: number, d: 1 | -1) => (v < 100 || (v === 100 && d < 0) ? 10 : 50);
    const ui = await render(
      themed(<Stepper label="Cup" value={100} min={100} max={100} step={step} onChange={onChange} decreaseLabel="Less" increaseLabel="More" />, 'dark'),
    );
    await expect(ui.press('Less')).rejects.toThrow();
    await expect(ui.press('More')).rejects.toThrow();
    await ui.update(themed(<Stepper label="Cup" value={100} min={10} max={1000} step={step} onChange={onChange} decreaseLabel="Less" increaseLabel="More" />, 'dark'));
    await ui.press('Less');
    expect(onChange).toHaveBeenLastCalledWith(90);
    await ui.press('More');
    expect(onChange).toHaveBeenLastCalledWith(150);
  });

  it('lets the value open an exact-amount editor', async () => {
    const onPressValue = jest.fn();
    const ui = await render(themed(<Stepper label="Amount" value={250} min={0} max={1000} onChange={jest.fn()} onPressValue={onPressValue} valueHint="Type an amount" />));
    await ui.press('Amount 250');
    expect(onPressValue).toHaveBeenCalled();
  });
});

describe('SystemNavBar', () => {
  it('renders nothing in a build without the navigation-bar module', async () => {
    const ui = await render(<SystemNavBar dark />);
    expect(ui.json()).toBeNull();
  });

  it('sets the button style when the module is present', () => {
    jest.isolateModules(() => {
      jest.doMock('expo', () => ({ requireOptionalNativeModule: () => ({}) }));
      const NavigationBar = jest.fn(() => null);
      jest.doMock('expo-navigation-bar', () => ({ NavigationBar }));
      const { SystemNavBar: Bar } = require('../index') as typeof import('../index');
      expect((Bar({ dark: true }) as React.ReactElement<{ style: string }>).props.style).toBe('light');
      expect((Bar({ dark: false }) as React.ReactElement<{ style: string }>).props.style).toBe('dark');
    });
  });
});
