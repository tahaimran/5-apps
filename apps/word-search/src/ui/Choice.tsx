import { StyleSheet, View, useWindowDimensions } from 'react-native';
import Animated, { useReducedMotion } from 'react-native-reanimated';
import { useTheme } from '@shared/theme';
import { PressableScale, Segmented } from '@shared/ui';
import { AppText } from './AppText';
import { CSS_EASE_OUT, STATE_MS } from './motion';
import { OptionCard } from './OptionCard';

export interface ChoiceOption<T extends string> {
  value: T;
  label: string;
  accessibilityLabel?: string;
}

/**
 * Past this text scale (the phone's font scale times the app's own letter size) a row of segments would
 * squeeze its labels, so the choices stack instead. Four segments get less room than three.
 */
export const SEGMENTED_MAX_FONT_SCALE = 1.3;
export const SEGMENTED_MAX_FONT_SCALE_FOUR = 1.15;

/**
 * One choice out of a few (theme, clock, units): the shared sliding Segmented control at normal text
 * sizes, and full-width radio cards once the phone's text is large, so no label is ever cut.
 */
export function ChoiceGroup<T extends string>({ options, value, onChange }: { options: ChoiceOption<T>[]; value: T; onChange: (v: T) => void }) {
  const { fontScale } = useWindowDimensions();
  const { spacing, type } = useTheme();
  // The app's letter size scales the shared type (body is 16sp at 1x).
  const scale = fontScale * (type.body.fontSize / 16);
  if (scale <= (options.length >= 4 ? SEGMENTED_MAX_FONT_SCALE_FOUR : SEGMENTED_MAX_FONT_SCALE)) return <Segmented options={options} value={value} onChange={onChange} />;
  return (
    <View accessibilityRole="radiogroup" style={{ gap: spacing.sm }}>
      {options.map((o) => (
        <OptionCard key={o.value} label={o.accessibilityLabel ?? o.label} selected={o.value === value} onPress={() => onChange(o.value)} />
      ))}
    </View>
  );
}

/**
 * Pills that tag something (Mild / Moderate / Strong). Tapping the chosen one clears it. They wrap
 * onto more lines rather than shrink, and fill with a short CSS transition.
 */
export function ChipRow<T extends string>({ options, value, onChange }: { options: ChoiceOption<T>[]; value: T | undefined; onChange: (v: T | undefined) => void }) {
  const { colors, radius, spacing, type, touchTarget } = useTheme();
  const reduced = useReducedMotion();
  return (
    <View style={[styles.row, { gap: spacing.sm }]}>
      {options.map((o) => {
        const selected = o.value === value;
        return (
          <PressableScale
            key={o.value}
            accessibilityRole="button"
            accessibilityLabel={o.accessibilityLabel ?? o.label}
            accessibilityState={{ selected }}
            onPress={() => onChange(selected ? undefined : o.value)}
            scaleTo={0.95}
            style={styles.chip}
          >
            <Animated.View
              style={[
                styles.chipFill,
                {
                  minHeight: touchTarget,
                  borderRadius: radius.pill,
                  paddingHorizontal: spacing.lg,
                  backgroundColor: selected ? colors.primary : colors.surfaceAlt,
                  transitionProperty: 'backgroundColor',
                  transitionDuration: reduced ? 0 : STATE_MS,
                  transitionTimingFunction: CSS_EASE_OUT,
                },
              ]}
            >
              <AppText style={[type.bodyLarge, { color: selected ? colors.onPrimary : colors.text, fontWeight: selected ? '700' : '600', textAlign: 'center' }]}>{o.label}</AppText>
            </Animated.View>
          </PressableScale>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap' },
  chip: { flexGrow: 1, flexBasis: 96 },
  chipFill: { alignItems: 'center', justifyContent: 'center' },
});
