import { useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { t } from '@shared/i18n';
import { useTheme } from '@shared/theme';
import { checklistText, groupsOf, progressOf } from '@/domain/checklists';
import type { ChecklistId } from '@/domain/types';
import { shareText } from '@/export/share';
import { useChecklist } from '@/hooks/useChecklist';
import { useChecklists } from '@/store/checklists';
import { AppText } from '@/ui/AppText';
import { BigButton } from '@/ui/BigButton';
import { IconButton } from '@/ui/IconButton';
import { Screen } from '@/ui/Screen';
import { ScreenHeader } from '@/ui/ScreenHeader';
import type { ReactNode } from 'react';

/** The checklist as text, used by the Share button and by the share-summary screen. */
export const planText = (id: ChecklistId, list = useChecklists.getState().lists[id]): string =>
  list ? checklistText(list, t('lists.planShareHeading'), (g) => t(`lists.group.${g}`), t('lists.done'), t('lists.open')) : '';

/**
 * The hospital bag and the birth plan (plan F13, F14): tick, add, delete, reorder, and a progress figure.
 * `footer` is where the templates (milestone 8) and the ad banner go.
 */
export function ChecklistScreen({ id, title, intro, progressText, share, footer, banner }: { id: ChecklistId; title: string; intro: string; progressText: (p: ReturnType<typeof progressOf>) => string; share?: boolean; footer?: ReactNode; banner?: ReactNode }) {
  const { colors, spacing, radius, type } = useTheme();
  const list = useChecklist(id);
  const [editing, setEditing] = useState(false);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const progress = progressOf(list);
  const store = useChecklists.getState;

  return (
    <Screen footer={banner}>
      <ScreenHeader title={title} />
      <AppText style={[type.bodyLarge, { color: colors.textMuted }]}>{intro}</AppText>

      <View accessible accessibilityLabel={t('lists.progressLabel', { percent: progress.percent, checked: progress.checked, total: progress.total })} style={{ gap: spacing.xs }}>
        <AppText style={[type.title, { color: colors.text, fontWeight: '700' }]}>{progressText(progress)}</AppText>
        <View style={{ height: 14, borderRadius: 7, borderWidth: 2, borderColor: colors.text, overflow: 'hidden', backgroundColor: colors.surface }}>
          <View style={{ width: `${progress.percent}%`, height: '100%', backgroundColor: colors.text }} />
        </View>
      </View>

      <BigButton variant="secondary" label={t(editing ? 'lists.editDone' : 'lists.edit')} onPress={() => setEditing((e) => !e)} />

      {groupsOf(list).map(({ group, items }) => (
        <View key={group} style={{ gap: spacing.sm }}>
          <AppText accessibilityRole="header" style={[type.title, { color: colors.text, fontWeight: '700', marginTop: spacing.sm }]}>{t(`lists.group.${group}`)}</AppText>
          {items.map((item, index) => (
            <View key={item.id} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
              <Pressable
                accessibilityRole="checkbox"
                accessibilityLabel={t('lists.toggleLabel', { label: item.label, state: t(item.checked ? 'lists.checked' : 'lists.unchecked') })}
                accessibilityState={{ checked: item.checked }}
                onPress={() => store().toggle(id, item.id)}
                style={({ pressed }) => ({ flex: 1, minHeight: 64, flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, backgroundColor: pressed ? colors.surfaceAlt : colors.surface })}
              >
                <MaterialCommunityIcons accessible={false} name={item.checked ? 'checkbox-marked' : 'checkbox-blank-outline'} size={32} color={colors.text} />
                <AppText style={[type.bodyLarge, { color: colors.text, flex: 1, textDecorationLine: item.checked ? 'line-through' : 'none' }]}>{item.label}</AppText>
              </Pressable>
              {editing ? (
                <View style={{ flexDirection: 'row', gap: spacing.xs }}>
                  <IconButton icon="arrow-up" label={t('lists.up', { label: item.label })} onPress={() => store().move(id, item.id, 'up')} />
                  <IconButton icon="arrow-down" label={t('lists.down', { label: item.label })} onPress={() => store().move(id, item.id, 'down')} />
                  <IconButton icon="delete-outline" label={t('lists.remove', { label: item.label })} onPress={() => store().remove(id, item.id)} />
                </View>
              ) : null}
            </View>
          ))}
          {editing ? (
            <View style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'center' }}>
              <TextInput
                accessibilityLabel={t('lists.addLabel', { group: t(`lists.group.${group}`) })}
                placeholder={t('lists.addPlaceholder')}
                placeholderTextColor={colors.textMuted}
                value={drafts[group] ?? ''}
                onChangeText={(text) => setDrafts((d) => ({ ...d, [group]: text }))}
                onSubmitEditing={() => {
                  store().add(id, group, drafts[group] ?? '');
                  setDrafts((d) => ({ ...d, [group]: '' }));
                }}
                returnKeyType="done"
                style={{ flex: 1, minHeight: 56, paddingHorizontal: spacing.md, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, color: colors.text, backgroundColor: colors.surface, fontSize: type.bodyLarge.fontSize }}
              />
              <BigButton
                label={t('lists.addButton')}
                accessibilityLabel={t('lists.addButtonLabel', { group: t(`lists.group.${group}`) })}
                onPress={() => {
                  store().add(id, group, drafts[group] ?? '');
                  setDrafts((d) => ({ ...d, [group]: '' }));
                }}
              />
            </View>
          ) : null}
        </View>
      ))}

      {share ? <BigButton tall label={t('lists.shareText')} onPress={() => void shareText(planText(id, list))} /> : null}
      {footer}
    </Screen>
  );
}
