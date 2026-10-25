import { StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useTheme } from '@shared/theme';
import { useAppColors, useIsHighContrast } from '@/theme/mode';
import { AppText } from './AppText';

const TAIL = 22;

/**
 * A gold title ribbon with folded tails (the game's screen titles: "Daily puzzle", "Well done!").
 * The face is an ordinary view, so a long title or a large font wraps onto more lines and the ribbon
 * grows with it; only the tails are drawn. In high contrast it is a black band with a yellow edge.
 */
export function Ribbon({ title, size = 'md', header = true }: { title: string; size?: 'md' | 'lg'; header?: boolean }) {
  const { type, spacing } = useTheme();
  const app = useAppColors();
  const hc = useIsHighContrast();
  const text = size === 'lg' ? type.display : type.title;
  const tail = (flip: boolean) => (
    <Svg width={TAIL} height={40} viewBox="0 0 22 40" style={[styles.tail, flip ? styles.right : styles.left]}>
      <Path d={flip ? 'M0 0 L22 0 L12 20 L22 40 L0 40 Z' : 'M22 0 L0 0 L10 20 L0 40 L22 40 Z'} fill={app.ribbonShade} />
    </Svg>
  );
  return (
    <View style={styles.wrap} accessibilityElementsHidden={false}>
      {!hc && tail(false)}
      {!hc && tail(true)}
      <View
        style={[
          styles.face,
          {
            backgroundColor: app.ribbon,
            paddingHorizontal: spacing.xl,
            paddingVertical: size === 'lg' ? spacing.sm : spacing.xs + 2,
            borderRadius: 10,
            borderWidth: hc ? 3 : 0,
            borderColor: app.onRibbon,
          },
        ]}
      >
        <AppText
          accessibilityRole={header ? 'header' : undefined}
          style={[text, { color: app.onRibbon, fontWeight: '800', textAlign: 'center' }]}
        >
          {title}
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignSelf: 'center', justifyContent: 'center', paddingHorizontal: TAIL - 8, maxWidth: '100%' },
  face: { alignItems: 'center', justifyContent: 'center', minHeight: 44 },
  tail: { position: 'absolute', top: 10 },
  left: { left: 0 },
  right: { right: 0 },
});
