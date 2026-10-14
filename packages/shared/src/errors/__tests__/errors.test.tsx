import { resetDisk } from '../../testing/native';
import { cleanup, render } from '../../testing/render';
import { CrashScreen } from '../index';

beforeEach(() => resetDisk());
afterEach(cleanup);

describe('CrashScreen', () => {
  it('renders outside any ThemeProvider (the root boundary wraps the provider itself)', async () => {
    const screen = await render(<CrashScreen error={new Error('boom')} retry={jest.fn(async () => undefined)} />);
    expect(screen.texts()).toEqual(expect.arrayContaining(['Something went wrong', 'Try again']));
  });

  it('shows the error message so a tester can report it', async () => {
    const screen = await render(<CrashScreen error={new Error('Cannot read property x of undefined')} retry={jest.fn(async () => undefined)} />);
    expect(screen.texts().join('\n')).toContain('Cannot read property x of undefined');
  });

  it('retries when the button is pressed', async () => {
    const retry = jest.fn(async () => undefined);
    const screen = await render(<CrashScreen error={new Error('boom')} retry={retry} />);
    await screen.press('Try again');
    expect(retry).toHaveBeenCalledTimes(1);
  });

  it('copes with a thrown non-Error value', async () => {
    const screen = await render(<CrashScreen error={'plain string' as unknown as Error} retry={jest.fn(async () => undefined)} />);
    expect(screen.texts().join('\n')).toContain('plain string');
  });
});
