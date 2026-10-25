import { t } from '@shared/i18n';
import { useTheme, type ThemePreference } from '@shared/theme';
import { ChoiceGroup } from '@/ui/Choice';

const CHOICES: ThemePreference[] = ['system', 'light', 'dark', 'high-contrast'];

/** Light, dark, high contrast or follow the phone (plan F4). Applies at once, even mid-puzzle. */
export function ThemePicker() {
  const { preference, setPreference } = useTheme();
  return (
    <ChoiceGroup
      options={CHOICES.map((c) => ({ value: c, label: t(`theme.short.${c}`), accessibilityLabel: t(`theme.${c}`) }))}
      value={preference}
      onChange={setPreference}
    />
  );
}
