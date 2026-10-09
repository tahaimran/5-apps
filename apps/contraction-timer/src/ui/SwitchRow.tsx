import { Switch, View } from 'react-native';
import { t } from '@shared/i18n';
import { useTheme } from '@shared/theme';
import { AppText } from './AppText';

/** A setting row of at least 64dp: the label, the switch, and "On"/"Off" written out (plan §5.6). */
export function SwitchRow({ label, value, onChange, hint }: { label: string; value: boolean; onChange: (v: boolean) => void; hint?: string }) {
  const { colors, spacing, radius, type } = useTheme();
  return (
    <View style={{ minHeight: 64, padding: spacing.md, borderRadius: radius.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, gap: 2 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
        <AppText style={[type.bodyLarge, { color: colors.text, fontWeight: '700', flex: 1 }]}>{label}</AppText>
        <AppText style={[type.body, { color: colors.textMuted, fontWeight: '700' }]}>{value ? t('common.on') : t('common.off')}</AppText>
        <Switch
          accessibilityLabel={label}
          value={value}
          onValueChange={onChange}
          trackColor={{ true: colors.primary, false: colors.border }}
          thumbColor={value ? colors.onPrimary : colors.textMuted}
          style={{ minWidth: 56, minHeight: 48 }}
        />
      </View>
      {hint ? <AppText style={[type.body, { color: colors.textMuted }]}>{hint}</AppText> : null}
    </View>
  );
}
