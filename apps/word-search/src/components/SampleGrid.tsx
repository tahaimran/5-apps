import { View } from 'react-native';
import { t } from '@shared/i18n';
import { useTheme } from '@shared/theme';
import type { TextSize } from '@/domain/types';
import { useAppColors, useGameColors, useIsHighContrast } from '@/theme/mode';
import { GRID_FONT, minCellDp, textScale } from '@/theme/tokens';
import { AppText } from '@/ui/AppText';

const SAMPLE = ['CATS', 'OXEN', 'WOLF', 'DEER'];

/** A 4x4 sample on the game's board that shows a text size before it is chosen (plan §5.6, §6 screen 2). */
export function SampleGrid({ textSize }: { textSize: TextSize }) {
  const { colors, radius, shadow } = useTheme();
  const app = useAppColors();
  const g = useGameColors();
  const hc = useIsHighContrast();
  const cell = minCellDp[textSize];
  const letter = Math.min(textScale[textSize].gridLetter, Math.floor(cell * 0.62));
  return (
    <View
      accessible
      accessibilityLabel={t('textSize.sample', { size: t(`textSize.${textSize}`) })}
      style={[{ alignSelf: 'center', padding: 5, borderRadius: radius.md + 4, backgroundColor: app.board }, hc ? null : shadow(1)]}
    >
      <View style={{ borderRadius: radius.md, overflow: 'hidden', backgroundColor: g.gridCell }}>
        {SAMPLE.map((row, r) => (
          <View key={row} style={{ flexDirection: 'row' }}>
            {row.split('').map((ch, i) => {
              // The first word is shown found, so the size of a highlighted letter can be judged too.
              const found = r === 0;
              return (
                <View key={i} style={{ width: cell, height: cell, alignItems: 'center', justifyContent: 'center', borderWidth: 0.5, borderColor: g.gridBorder, backgroundColor: found && !hc ? g.highlights[0] : undefined }}>
                  <AppText maxFontSizeMultiplier={1.4} style={{ fontFamily: GRID_FONT, fontSize: letter, lineHeight: Math.ceil(letter * 1.2), color: found ? g.onHighlight : colors.text, fontWeight: '700' }}>
                    {ch}
                  </AppText>
                </View>
              );
            })}
          </View>
        ))}
      </View>
    </View>
  );
}
