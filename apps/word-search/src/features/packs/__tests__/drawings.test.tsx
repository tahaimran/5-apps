import '@/testing/mocks';
import { resetApp } from '@/testing/stores';
import { cleanup, render } from '@/testing/ui';
import { ThemeProvider } from '@shared/theme';
import { sharedStore } from '@shared/storage';
import '@/bootstrap';
import { PACKS } from '@/domain/packs';
import { themeProps } from '@/theme/tokens';
import { PACK_DRAWINGS, PACK_TINTS, SCENE_DRAWINGS } from '../drawings';
import { PackArt, PackTile, SceneArt } from '../PackArt';

beforeEach(() => resetApp());
afterEach(async () => {
  await cleanup();
  sharedStore.remove('theme.mode');
});

describe('pack pictures', () => {
  it('has a drawing and a tile color for every bundled pack, and none for packs that do not exist', () => {
    expect(Object.keys(PACK_DRAWINGS).sort()).toEqual(PACKS.map((p) => p.id).sort());
    expect(Object.keys(PACK_TINTS).sort()).toEqual(PACKS.map((p) => p.id).sort());
  });

  it('draws every pack and scene in every mode, hidden from screen readers', async () => {
    for (const mode of ['light', 'dark', 'high-contrast'] as const) {
      sharedStore.set('theme.mode', mode);
      const ui = await render(
        <ThemeProvider {...themeProps}>
          {PACKS.map((p) => (
            <PackTile key={p.id} packId={p.id} px={84} />
          ))}
          {(Object.keys(SCENE_DRAWINGS) as (keyof typeof SCENE_DRAWINGS)[]).map((s) => (
            <SceneArt key={s} scene={s} px={80} />
          ))}
        </ThemeProvider>,
      );
      const pictures = ui.root.findAll((n) => typeof n.type === 'string' && n.props.viewBox === '0 0 100 100');
      expect(pictures).toHaveLength(PACKS.length + Object.keys(SCENE_DRAWINGS).length);
      for (const p of pictures) expect(p.props.importantForAccessibility).toBe('no-hide-descendants');
      await cleanup();
    }
  });

  it('draws nothing for an unknown pack instead of crashing', async () => {
    const ui = await render(
      <ThemeProvider {...themeProps}>
        <PackArt packId="no-such-pack" px={40} />
      </ThemeProvider>,
    );
    expect(ui.root.findAll((n) => typeof n.type === 'string' && n.props.viewBox === '0 0 100 100')).toHaveLength(0);
  });
});
