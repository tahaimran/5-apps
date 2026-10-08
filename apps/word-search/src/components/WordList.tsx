import { StyleSheet, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { t } from '@shared/i18n';
import { useTheme } from '@shared/theme';
import type { PlacedWord, TextSize } from '@/domain/types';
import { gameColors, textScale } from '@/theme/tokens';
import { AppText } from '@/ui/AppText';

const titleCase = (w: string) => w.charAt(0) + w.slice(1).toLowerCase();

/**
 * The words to find (plan §5.3): wrapping chips, found ones struck through with a check mark and a
 * dot in their highlight color, so state is never shown by color alone. Reads "Lion, found".
 */
export function WordList({ words, textSize }: { words: readonly PlacedWord[]; textSize: TextSize }) {
  const { colors, mode, radius, spacing, type } = useTheme();
  const g = gameColors[mode];
  const left = words.filter((w) => !w.found).length;
  const fontSize = textScale[textSize].chip;
  return (
    <View style={{ gap: spacing.sm }}>
      <AppText accessibilityLiveRegion="polite" style={[type.body, { color: colors.textMuted, fontWeight: '700' }]}>
        {left === 0 ? t('game.allFound') : t('game.wordsLeft', { count: left })}
      </AppText>
      <View style={[styles.wrap, { gap: spacing.sm }]}>
        {words.map((w) => (
          <View
            key={w.word}
            accessible
            accessibilityLabel={t(w.found ? 'game.wordFound' : 'game.wordNotFound', { word: titleCase(w.word) })}
            style={[
              styles.chip,
              { borderRadius: radius.md, borderColor: w.found ? colors.success : colors.border, backgroundColor: colors.surface, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
            ]}
          >
            {w.found && (
              <>
                <View style={[styles.dot, { backgroundColor: g.highlights[(w.colorIdx ?? 0) % g.highlights.length], borderColor: colors.text }]} />
                <MaterialCommunityIcons name="check" size={fontSize} color={colors.success} />
              </>
            )}
            <AppText
              style={{
                fontSize,
                lineHeight: Math.ceil(fontSize * 1.25),
                color: w.found ? colors.textMuted : colors.text,
                fontWeight: '700',
                textDecorationLine: w.found ? 'line-through' : 'none',
              }}
            >
              {w.word}
            </AppText>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', flexWrap: 'wrap' },
  chip: { flexDirection: 'row', alignItems: 'center', borderWidth: 2, gap: 6 },
  dot: { width: 14, height: 14, borderRadius: 7, borderWidth: 1 },
});
