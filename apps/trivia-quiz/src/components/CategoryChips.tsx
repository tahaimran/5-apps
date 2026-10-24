import { StyleSheet, View } from 'react-native';
import Check from 'lucide-react-native/icons/check';
import { t } from '@shared/i18n';
import { useTheme } from '@shared/theme';
import { PressableScale } from '@shared/ui';
import { CATEGORIES } from '@/domain/categories';
import type { CategoryId } from '@/domain/types';
import { AppText } from '@/ui/AppText';
import { categoryTone } from '@/ui/categoryTone';
import { categoryIcons } from '@/ui/icons';

/**
 * The 12 category chips (plan §6 O2): each in its own hue. A picked chip fills with that hue and swaps
 * its icon for a check mark, so the choice never relies on color alone.
 */
export function CategoryChips({ value, onChange }: { value: CategoryId[]; onChange: (next: CategoryId[]) => void }) {
  const { colors, radius, spacing, touchTarget, shadow, mode } = useTheme();
  const toggle = (id: CategoryId) => onChange(value.includes(id) ? value.filter((c) => c !== id) : [...value, id]);
  return (
    <View style={[styles.wrap, { gap: spacing.sm }]} accessibilityRole="list">
      {CATEGORIES.map((c) => {
        const on = value.includes(c.id);
        const Icon = on ? Check : categoryIcons[c.id];
        return (
          <PressableScale
            key={c.id}
            accessibilityRole="checkbox"
            accessibilityLabel={t(`categories.${c.id}`)}
            accessibilityState={{ checked: on }}
            onPress={() => toggle(c.id)}
            scaleTo={0.95}
            style={[
              styles.chip,
              { minHeight: touchTarget, gap: spacing.xs, paddingHorizontal: spacing.md, borderRadius: radius.pill, backgroundColor: on ? c.strong : colors.surface },
              on ? null : shadow(1),
            ]}
          >
            <Icon size={18} color={on ? '#FFFFFF' : categoryTone(c.id, mode).icon} strokeWidth={on ? 3 : 2.3} />
            <AppText variant="body" style={{ fontWeight: on ? '700' : '600', color: on ? '#FFFFFF' : colors.text }}>
              {t(`categories.${c.id}`)}
            </AppText>
          </PressableScale>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', flexWrap: 'wrap' },
  chip: { flexDirection: 'row', alignItems: 'center' },
});
