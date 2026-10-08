import { View } from 'react-native';
import { t } from '@shared/i18n';
import { useTheme } from '@shared/theme';
import type { TextSize } from '@/domain/types';
import { gameColors, minCellDp, textScale } from '@/theme/tokens';
import { AppText } from '@/ui/AppText';

const SAMPLE = ['CATS', 'OXEN', 'WOLF', 'DEER'];

/** A 4x4 sample grid that shows a text size before it is chosen (plan §5.6, §6 screen 2). */
export function SampleGrid({ textSize }: { textSize: TextSize }) {
  const { colors, mode } = useTheme();
  const g = gameColors[mode];
  const cell = minCellDp[textSize];
  const letter = Math.min(textScale[textSize].gridLetter, Math.floor(cell * 0.62));
  return (
    <View
      accessible
      accessibilityLabel={t('textSize.sample', { size: t(`textSize.${textSize}`) })}
      style={{ alignSelf: 'center', borderWidth: 1, borderColor: g.gridBorder, borderRadius: 12, overflow: 'hidden', backgroundColor: g.gridCell }}
    >
      {SAMPLE.map((row) => (
        <View key={row} style={{ flexDirection: 'row' }}>
          {row.split('').map((ch, i) => (
            <View key={i} style={{ width: cell, height: cell, alignItems: 'center', justifyContent: 'center', borderWidth: 0.5, borderColor: g.gridBorder }}>
              <AppText maxFontSizeMultiplier={1.4} style={{ fontSize: letter, lineHeight: Math.ceil(letter * 1.2), color: colors.text, fontWeight: '700' }}>
                {ch}
              </AppText>
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}
