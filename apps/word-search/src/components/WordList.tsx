import { useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useReducedMotion } from 'react-native-reanimated';
import Check from 'lucide-react-native/icons/check';
import { t } from '@shared/i18n';
import { useTheme } from '@shared/theme';
import type { PlacedWord, TextSize } from '@/domain/types';
import { useAppColors, useGameColors, useIsHighContrast } from '@/theme/mode';
import { GRID_FONT, textScale } from '@/theme/tokens';
import { AppText } from '@/ui/AppText';
import { CHIP_TICK, CSS_EASE_OUT, STATE_MS, TICK_MS } from '@/ui/motion';

const titleCase = (w: string) => w.charAt(0) + w.slice(1).toLowerCase();

/**
 * The words to find (plan §5.3) on a frosted panel: wrapping chips in Atkinson Hyperlegible. A found word
 * is struck through, gets a check mark and a dot in its pill's color, and ticks once, so state is never
 * shown by color alone. Reads "Lion, found". The count of words left is announced as it changes.
 */
export function WordList({ words, textSize }: { words: readonly PlacedWord[]; textSize: TextSize }) {
  const { colors, radius, spacing, type, shadow, fonts } = useTheme();
  const app = useAppColors();
  const g = useGameColors();
  const hc = useIsHighContrast();
  const reduced = useReducedMotion();
  const left = words.filter((w) => !w.found).length;
  const fontSize = textScale[textSize].chip;
  // Only words found while the list is on screen tick; a resumed puzzle's found words are just struck.
  const foundOnMount = useRef(new Set(words.filter((w) => w.found).map((w) => w.word)));
  return (
    <View style={[{ backgroundColor: hc ? colors.background : app.frost, borderRadius: radius.lg, padding: spacing.md, gap: spacing.sm }, hc ? { borderWidth: 2, borderColor: colors.border } : shadow(1)]}>
      <View style={[styles.head, { gap: spacing.sm }]}>
        <AppText accessibilityRole="header" style={[type.bodyLarge, styles.flex, { color: colors.text, fontWeight: '800', fontFamily: fonts.display }]}>
          {t('game.wordsTitle')}
        </AppText>
        <AppText accessibilityLiveRegion="polite" style={[type.body, { color: colors.textMuted, fontWeight: '700' }]}>
          {left === 0 ? t('game.allFound') : t('game.wordsLeft', { count: left })}
        </AppText>
      </View>
      <View style={[styles.wrap, { gap: spacing.sm }]}>
        {words.map((w) => {
          const i = (w.colorIdx ?? 0) % g.highlights.length;
          const tick = w.found && !reduced && !foundOnMount.current.has(w.word);
          return (
            <Animated.View
              key={w.word}
              accessible
              accessibilityLabel={t(w.found ? 'game.wordFound' : 'game.wordNotFound', { word: titleCase(w.word) })}
              style={[
                styles.chip,
                {
                  minHeight: 44,
                  borderRadius: radius.pill,
                  paddingHorizontal: spacing.md,
                  paddingVertical: spacing.xs,
                  gap: 6,
                  backgroundColor: w.found && !hc ? colors.surfaceAlt : colors.surface,
                  borderColor: w.found ? (hc ? g.edges[i] : colors.surfaceAlt) : hc ? colors.border : app.divider,
                  transitionProperty: ['backgroundColor', 'borderColor'],
                  transitionDuration: reduced ? 0 : STATE_MS,
                  transitionTimingFunction: CSS_EASE_OUT,
                },
                tick ? { animationName: CHIP_TICK, animationDuration: TICK_MS, animationTimingFunction: CSS_EASE_OUT } : null,
              ]}
            >
              {w.found && (
                <>
                  <View style={[styles.dot, { backgroundColor: hc ? g.edges[i] : g.highlights[i], borderColor: g.edges[i] }]} />
                  <Check size={Math.round(fontSize * 0.9)} color={colors.success} strokeWidth={3} />
                </>
              )}
              <AppText
                style={{
                  fontFamily: GRID_FONT,
                  fontSize,
                  lineHeight: Math.ceil(fontSize * 1.25),
                  color: w.found ? colors.textMuted : colors.text,
                  fontWeight: '700',
                  textDecorationLine: w.found ? 'line-through' : 'none',
                }}
              >
                {w.word}
              </AppText>
            </Animated.View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  head: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' },
  wrap: { flexDirection: 'row', flexWrap: 'wrap' },
  chip: { flexDirection: 'row', alignItems: 'center', borderWidth: 2 },
  dot: { width: 14, height: 14, borderRadius: 7, borderWidth: 2 },
});
