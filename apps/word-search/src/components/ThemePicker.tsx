import { View } from 'react-native';
import { t } from '@shared/i18n';
import { useTheme, type ThemePreference } from '@shared/theme';
import { OptionCard } from '@/ui/OptionCard';

const CHOICES: ThemePreference[] = ['system', 'light', 'dark', 'high-contrast'];

/** Light, dark, high contrast or follow the phone (plan F4). Applies at once, even mid-puzzle. */
export function ThemePicker() {
  const { preference, setPreference, spacing } = useTheme();
  return (
    <View style={{ gap: spacing.sm }} accessibilityRole="radiogroup">
      {CHOICES.map((choice) => (
        <OptionCard key={choice} label={t(`theme.${choice}`)} selected={preference === choice} onPress={() => setPreference(choice)} />
      ))}
    </View>
  );
}
