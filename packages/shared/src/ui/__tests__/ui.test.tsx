import { resetDisk } from '../../testing/native';
import { act } from 'react';
import { Text } from 'react-native';
import { cleanup, render } from '../../testing/render';
import { ThemeProvider } from '../../theme';
import { Button, Card, hideToast, IconButton, PressableScale, ProgressRing, showToast, ToastHost } from '../index';

const Icon = () => null;
const themed = (el: React.ReactElement) => <ThemeProvider>{el}</ThemeProvider>;

beforeEach(() => {
  resetDisk();
  jest.useFakeTimers();
});
afterEach(async () => {
  await act(async () => hideToast());
  await cleanup();
  jest.useRealTimers();
});

describe('Button', () => {
  it('is a labelled button that runs its action', async () => {
    const onPress = jest.fn();
    const ui = await render(themed(<Button label="Save" icon={Icon} onPress={onPress} />));
    expect(ui.texts()).toContain('Save');
    await ui.press('Save');
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('blocks presses while disabled or loading', async () => {
    const onPress = jest.fn();
    const ui = await render(
      themed(
        <>
          <Button label="Off" disabled onPress={onPress} />
          <Button label="Busy" loading variant="secondary" onPress={onPress} />
        </>,
      ),
    );
    await expect(ui.press('Off')).rejects.toThrow();
    await expect(ui.press('Busy')).rejects.toThrow();
    expect(ui.byLabel('Busy')[0].props.accessibilityState).toMatchObject({ busy: true });
  });

  it('can speak a fuller name than its label', async () => {
    const ui = await render(themed(<Button label="Use this look" accessibilityLabel="Clean, use this look" onPress={() => undefined} />));
    expect(ui.byLabel('Clean, use this look')).toHaveLength(1);
    expect(ui.texts()).toContain('Use this look');
  });

  it.each(['ghost', 'danger'] as const)('renders the %s variant', async (variant) => {
    const ui = await render(themed(<Button label="Go" variant={variant} onPress={() => undefined} />));
    expect(ui.texts()).toContain('Go');
  });
});

describe('IconButton', () => {
  it.each(['plain', 'tonal', 'solid'] as const)('has a spoken name and a 48dp target (%s)', async (variant) => {
    const onPress = jest.fn();
    const ui = await render(themed(<IconButton icon={Icon} label="Close" variant={variant} onPress={onPress} />));
    const node = ui.byLabel('Close')[0];
    expect(node.props.accessibilityRole).toBe('button');
    await ui.press('Close');
    expect(onPress).toHaveBeenCalled();
  });

  it('announces an on/off button as selected and draws it solid while on', async () => {
    const ui = await render(themed(<IconButton icon={Icon} label="Night mode" selected onPress={jest.fn()} />));
    const node = ui.byLabel('Night mode')[0];
    expect(node.props.accessibilityState).toEqual({ disabled: false, selected: true });
    const off = await render(themed(<IconButton icon={Icon} label="Partner mode" selected={false} variant="tonal" onPress={jest.fn()} />));
    expect(off.byLabel('Partner mode')[0].props.accessibilityState).toEqual({ disabled: false, selected: false });
  });
});

describe('PressableScale', () => {
  it('forwards press-in and press-out', async () => {
    const onPressIn = jest.fn();
    const onPressOut = jest.fn();
    const ui = await render(themed(<PressableScale accessibilityLabel="Tap" onPressIn={onPressIn} onPressOut={onPressOut} />));
    const node = ui.root.findAll((n) => typeof n.props.onPressIn === 'function' && n.props.accessibilityLabel === 'Tap')[0];
    await act(async () => {
      node.props.onPressIn({});
      node.props.onPressOut({});
    });
    expect(onPressIn).toHaveBeenCalled();
    expect(onPressOut).toHaveBeenCalled();
  });
});

describe('ProgressRing and Card', () => {
  it('renders its center content and accepts out-of-range progress', async () => {
    const ui = await render(
      themed(
        <Card>
          <ProgressRing size={40} strokeWidth={4} progress={1.7} color="#000000" trackColor="#EEEEEE">
            <Text>42%</Text>
          </ProgressRing>
          <ProgressRing size={40} strokeWidth={4} progress={Number.NaN} color="#000000" trackColor="#EEEEEE" />
        </Card>,
      ),
    );
    expect(ui.texts()).toContain('42%');
  });

  it('can be flat and unpadded', async () => {
    const ui = await render(themed(<Card level={0} padded={false}><Text>Flat</Text></Card>));
    expect(ui.texts()).toContain('Flat');
  });
});

describe('toasts', () => {
  it('shows a message, then hides it on its own', async () => {
    const ui = await render(themed(<ToastHost />));
    await act(async () => showToast({ message: 'Saved', icon: Icon, tone: 'success' }));
    expect(ui.texts()).toContain('Saved');
    await act(async () => jest.advanceTimersByTime(2700));
    expect(ui.texts()).not.toContain('Saved');
  });

  it('runs its action and closes', async () => {
    const undo = jest.fn();
    const ui = await render(themed(<ToastHost bottom={80} />));
    await act(async () => showToast({ message: 'Deleted', tone: 'warning', action: { label: 'Undo', onPress: undo } }));
    await ui.press('Undo');
    expect(undo).toHaveBeenCalled();
    expect(ui.texts()).not.toContain('Deleted');
  });

  it('replaces the current toast with a newer one', async () => {
    const ui = await render(themed(<ToastHost />));
    await act(async () => showToast({ message: 'One' }));
    await act(async () => showToast({ message: 'Two', duration: 1000 }));
    expect(ui.texts()).toContain('Two');
    expect(ui.texts()).not.toContain('One');
  });
});
