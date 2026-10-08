import '@/testing/mocks';
import { Text } from 'react-native';
import { cleanup, render } from '@/testing/ui';
import { ThemeProvider, useTheme } from '@shared/theme';
import { palette } from '../tokens';

afterEach(cleanup);

function Probe() {
  const { type, touchTarget } = useTheme();
  return <Text accessibilityLabel={`${type.body.fontSize}/${type.display.fontSize}/${touchTarget}`}>x</Text>;
}

describe('Large text (plan §7.2)', () => {
  it('adds a 1.2x multiplier to the type scale and leaves the touch target alone', async () => {
    const normal = await render(<ThemeProvider palette={palette}><Probe /></ThemeProvider>);
    expect(normal.byLabel('16/36/48')).toHaveLength(1);
    await cleanup();
    const large = await render(<ThemeProvider palette={palette} fontScale={1.2}><Probe /></ThemeProvider>);
    expect(large.byLabel('19/43/48')).toHaveLength(1);
  });
});
