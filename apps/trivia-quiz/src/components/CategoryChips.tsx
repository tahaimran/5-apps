import { Pressable, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { t } from '@shared/i18n';
import { useTheme } from '@shared/theme';
import { CATEGORIES } from '@/domain/categories';
import type { CategoryId } from '@/domain/types';
import { AppText } from '@/ui/AppText';

/** The 12 category chips (plan §6 O2): icon, name and a check mark when picked, so colour is never the only cue. */
export function CategoryChips({ value, onChange }: { value: CategoryId[]; onChange: (next: CategoryId[]) => void }) {
  const { colors, radius, spacing, touchTarget } = useTheme();
  const toggle = (id: CategoryId) => onChange(value.includes(id) ? value.filter((c) => c !== id) : [...value, id]);
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }} accessibilityRole="list">
      {CATEGORIES.map((c) => {
        const on = value.includes(c.id);
        return (
          <Pressable
            key={c.id}
            accessibilityRole="checkbox"
            accessibilityLabel={t(`categories.${c.id}`)}
            accessibilityState={{ checked: on }}
            onPress={() => toggle(c.id)}
            style={{ minHeight: touchTarget, flexDirection: 'row', alignItems: 'center', gap: spacing.xs, paddingHorizontal: spacing.md, borderRadius: radius.pill, borderWidth: on ? 3 : 1, borderColor: on ? colors.primary : colors.border, backgroundColor: on ? colors.surfaceAlt : colors.surface }}
          >
            <MaterialCommunityIcons name={on ? 'check-circle' : (c.icon as 'earth')} size={20} color={on ? colors.primary : c.strong} />
            <AppText variant="body" style={{ fontWeight: on ? '700' : '500' }}>{t(`categories.${c.id}`)}</AppText>
          </Pressable>
        );
      })}
    </View>
  );
}
