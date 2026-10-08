import { View } from 'react-native';
import { t } from '@shared/i18n';
import { useTheme } from '@shared/theme';
import type { TextSize } from '@/domain/types';
import { TEXT_SIZES } from '@/theme/tokens';
import { OptionCard } from '@/ui/OptionCard';
import { SampleGrid } from './SampleGrid';

/** The four letter sizes with a live sample (plan F4). Used by Settings, the play screen's menu and onboarding. */
export function TextSizePicker({ value, onChange, showSample = true }: { value: TextSize; onChange: (s: TextSize) => void; showSample?: boolean }) {
  const { spacing } = useTheme();
  return (
    <View style={{ gap: spacing.sm }} accessibilityRole="radiogroup">
      {showSample && <SampleGrid textSize={value} />}
      {TEXT_SIZES.map((size) => (
        <OptionCard
          key={size}
          label={t(`textSize.${size}`)}
          detail={size === 'large' ? t('textSize.recommended') : undefined}
          selected={value === size}
          onPress={() => onChange(size)}
        />
      ))}
    </View>
  );
}
