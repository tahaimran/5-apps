import { View } from 'react-native';
import Svg from 'react-native-svg';
import { useTheme } from '@shared/theme';
import { useIsHighContrast } from '@/theme/mode';
import { contrastTone, drawingFor, PACK_TINTS, SCENE_DRAWINGS, type Tone } from './drawings';

const sameTone: Tone = (hex) => hex;

/** A pack's drawing at `px` dp, recolored for high contrast. Decoration only: the caller names the pack. */
export function PackArt({ packId, px }: { packId: string; px: number }) {
  const hc = useIsHighContrast();
  const draw = drawingFor(packId);
  if (!draw) return null;
  return (
    <Svg width={px} height={px} viewBox="0 0 100 100" importantForAccessibility="no-hide-descendants" accessible={false}>
      {draw(hc ? contrastTone : sameTone)}
    </Svg>
  );
}

/** A scene picture (the onboarding welcome, the Daily card) at `px` dp. Decoration only. */
export function SceneArt({ scene, px }: { scene: keyof typeof SCENE_DRAWINGS; px: number }) {
  const hc = useIsHighContrast();
  return (
    <Svg width={px} height={px} viewBox="0 0 100 100" importantForAccessibility="no-hide-descendants" accessible={false}>
      {SCENE_DRAWINGS[scene](hc ? contrastTone : sameTone)}
    </Svg>
  );
}

/** The drawing on its soft tile (the pack's tint on light, a raised tile at night, an outline in high contrast). */
export function PackTile({ packId, px, radius = 16 }: { packId: string; px: number; radius?: number }) {
  const { colors, mode } = useTheme();
  const bg = mode === 'light' ? PACK_TINTS[packId] ?? colors.surfaceAlt : mode === 'dark' ? colors.surfaceAlt : colors.background;
  return (
    <View
      importantForAccessibility="no-hide-descendants"
      style={{ width: px, height: px, borderRadius: radius, backgroundColor: bg, alignItems: 'center', justifyContent: 'center', borderWidth: mode === 'high-contrast' ? 2 : 0, borderColor: colors.border }}
    >
      <PackArt packId={packId} px={Math.round(px * 0.86)} />
    </View>
  );
}
