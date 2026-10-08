import '@/testing/mocks';
import { cleanup, render } from '@/testing/ui';
import { ThemeProvider } from '@shared/theme';
import '@/bootstrap';
import type { PlantStage } from '@/domain/types';
import type { Mood } from '@/domain/plant';
import { palette } from '@/theme/tokens';
import { Plant } from '../Plant';

afterEach(cleanup);

describe('Plant', () => {
  it.each([0, 1, 2, 3, 4] as PlantStage[])('describes stage %i for a screen reader in every mood', async (stage) => {
    for (const mood of ['thirsty', 'ok', 'happy', 'sparkle'] as Mood[]) {
      const ui = await render(
        <ThemeProvider palette={palette}>
          <Plant stage={stage} mood={mood} />
        </ThemeProvider>,
      );
      const names = ['seed', 'sprout', 'seedling', 'young plant', 'blooming plant'];
      const moods = { thirsty: 'thirsty', ok: 'okay', happy: 'happy', sparkle: 'sparkling with joy' };
      expect(ui.byLabel(`Your plant is a ${names[stage]} and looks ${moods[mood]}`)).toHaveLength(1);
      await cleanup();
    }
  });
  it('accepts every skin', async () => {
    for (const skin of ['classic', 'sky', 'berry', 'sunny', 'mint', 'night', 'unknown']) {
      const ui = await render(
        <ThemeProvider palette={palette}>
          <Plant stage={4} mood="happy" skin={skin} size={120} />
        </ThemeProvider>,
      );
      expect(ui.byLabel(/blooming plant/)).toHaveLength(1);
      await cleanup();
    }
  });
});
