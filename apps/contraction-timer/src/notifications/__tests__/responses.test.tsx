import { mockLastNotificationResponse, mockRouter } from '@/testing/mocks';
import { resetApp } from '@/testing/stores';
import { cleanup, render } from '@/testing/ui';
import { useNotificationResponses, onNotificationOpen } from '../responses';

function Probe() {
  useNotificationResponses();
  return null;
}
const response = (id: string, url: unknown, action = 'expo.modules.notifications.actions.DEFAULT') => ({ actionIdentifier: action, notification: { request: { identifier: id, content: { data: { url } } } } });

beforeEach(() => {
  resetApp();
  mockRouter.navigate.mockClear();
});
afterEach(cleanup);

describe('tapping a notification', () => {
  it('opens the Kicks tab for the kick reminder and tells the ad rules the app was opened from a notification', async () => {
    const opened = jest.fn();
    const off = onNotificationOpen(opened);
    mockLastNotificationResponse.current = response('n1', 'contractiontimer://kicks');
    await render(<Probe />);
    expect(mockRouter.navigate).toHaveBeenCalledWith('/kicks');
    expect(opened).toHaveBeenCalledTimes(1);
    off();
  });
  it('handles one tap once, even if the screen is rebuilt', async () => {
    mockLastNotificationResponse.current = response('n2', 'contractiontimer://timer');
    await render(<Probe />);
    await cleanup();
    await render(<Probe />);
    expect(mockRouter.navigate).toHaveBeenCalledTimes(1);
  });
  it('ignores other actions and unknown links', async () => {
    mockLastNotificationResponse.current = response('n3', 'contractiontimer://timer', 'dismiss');
    await render(<Probe />);
    mockLastNotificationResponse.current = response('n4', 'https://evil.example/x');
    await cleanup();
    await render(<Probe />);
    expect(mockRouter.navigate).not.toHaveBeenCalled();
  });
});
