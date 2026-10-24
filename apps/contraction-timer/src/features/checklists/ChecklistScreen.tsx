import { useState, type ReactNode } from 'react';
import { StyleSheet, TextInput, View, useWindowDimensions } from 'react-native';
import Animated, { useReducedMotion } from 'react-native-reanimated';
import ArrowDown from 'lucide-react-native/icons/arrow-down';
import ArrowUp from 'lucide-react-native/icons/arrow-up';
import Check from 'lucide-react-native/icons/check';
import Pencil from 'lucide-react-native/icons/pencil';
import Plus from 'lucide-react-native/icons/plus';
import Share2 from 'lucide-react-native/icons/share-2';
import Trash from 'lucide-react-native/icons/trash';
import { t } from '@shared/i18n';
import { playSound } from '@shared/sound';
import { haptics, useTheme } from '@shared/theme';
import { Button, Card, IconButton, PressableScale, ProgressRing } from '@shared/ui';
import { checklistText, groupsOf, progressOf } from '@/domain/checklists';
import type { ChecklistId, ChecklistItem } from '@/domain/types';
import { shareText } from '@/export/share';
import { useAdScreen } from '@/ads/guard';
import { recordPositiveMoment } from '@/features/review/ask';
import { useChecklist } from '@/hooks/useChecklist';
import { useChecklists } from '@/store/checklists';
import { useAppColors } from '@/theme/mode';
import { AppText } from '@/ui/AppText';
import { CSS_EASE_OUT, STATE_MS } from '@/ui/motion';
import { Screen } from '@/ui/Screen';
import { SettingsGroup } from '@/ui/SettingsRow';
import { Templates } from './Templates';

/** The checklist as text, used by the Share button and by the share-summary screen. */
export const planText = (id: ChecklistId, list = useChecklists.getState().lists[id]): string =>
  list ? checklistText(list, t('lists.planShareHeading'), (g) => t(`lists.group.${g}`), t('lists.done'), t('lists.open')) : '';

/** One item: a round tick that fills (a CSS transition) and the label, struck through once done. */
function CheckRow({ item, onToggle }: { item: ChecklistItem; onToggle: () => void }) {
  const { colors, spacing, type, touchTarget } = useTheme();
  const reduced = useReducedMotion();
  return (
    <PressableScale
      accessibilityRole="checkbox"
      accessibilityLabel={t('lists.toggleLabel', { label: item.label, state: t(item.checked ? 'lists.checked' : 'lists.unchecked') })}
      accessibilityState={{ checked: item.checked }}
      onPress={onToggle}
      scaleTo={0.98}
      style={[styles.row, { minHeight: touchTarget + 8, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, gap: spacing.md }]}
    >
      <Animated.View
        style={[
          styles.tick,
          {
            borderColor: item.checked ? colors.primary : colors.border,
            backgroundColor: item.checked ? colors.primary : 'transparent',
            transitionProperty: ['backgroundColor', 'borderColor'],
            transitionDuration: reduced ? 0 : STATE_MS,
            transitionTimingFunction: CSS_EASE_OUT,
          },
        ]}
      >
        {item.checked ? <Check size={18} color={colors.onPrimary} strokeWidth={3} /> : null}
      </Animated.View>
      <AppText style={[type.bodyLarge, styles.flex, { color: item.checked ? colors.textMuted : colors.text, textDecorationLine: item.checked ? 'line-through' : 'none' }]}>{item.label}</AppText>
    </PressableScale>
  );
}

/**
 * The hospital bag and the birth plan (plan F13, F14): tick, add, delete, reorder, and a progress figure.
 * `footer` is where the templates (milestone 8) and the ad banner go.
 */
export function ChecklistScreen({ id, title, intro, progressText, share, footer, banner }: { id: ChecklistId; title: string; intro: string; progressText: (p: ReturnType<typeof progressOf>) => string; share?: boolean; footer?: ReactNode; banner?: ReactNode }) {
  const { colors, spacing, radius, type, fonts } = useTheme();
  const app = useAppColors();
  useAdScreen('checklist');
  const list = useChecklist(id);
  const [editing, setEditing] = useState(false);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const progress = progressOf(list);
  const store = useChecklists.getState;
  // The ring is a fixed 64dp: its percentage keeps its drawn size at any font scale (the row's label says it).
  const { fontScale } = useWindowDimensions();
  const fit = (sp: number) => Math.round(sp / Math.max(1, fontScale));
  const add = (group: string) => {
    store().add(id, group, drafts[group] ?? '');
    setDrafts((d) => ({ ...d, [group]: '' }));
  };
  const toggle = (item: ChecklistItem) => {
    const was = progressOf(list).percent;
    store().toggle(id, item.id);
    if (!item.checked) {
      void haptics.select();
      playSound('check');
    }
    const now = progressOf(store().lists[id] ?? list).percent;
    if (was < 100 && now === 100) void recordPositiveMoment('checklistComplete');
  };

  return (
    <Screen stack title={title} footer={banner}>
      <AppText style={[type.bodyLarge, { color: colors.textMuted }]}>{intro}</AppText>

      <Card style={[styles.row, { gap: spacing.lg }]}>
        <View accessible accessibilityLabel={t('lists.progressLabel', { percent: progress.percent, checked: progress.checked, total: progress.total })} style={[styles.row, styles.flex, { gap: spacing.lg }]}>
          <ProgressRing size={64} strokeWidth={7} progress={progress.percent / 100} color={colors.primary} trackColor={app.track}>
            <AppText style={{ fontSize: fit(15), lineHeight: fit(18), color: colors.text, fontFamily: fonts.display, fontWeight: '800' }}>{`${progress.percent}%`}</AppText>
          </ProgressRing>
          <AppText style={[type.bodyLarge, styles.flex, { color: colors.text, fontWeight: '700' }]}>{progressText(progress)}</AppText>
        </View>
      </Card>

      <Button variant="secondary" icon={editing ? Check : Pencil} label={t(editing ? 'lists.editDone' : 'lists.edit')} onPress={() => setEditing((e) => !e)} />

      {groupsOf(list).map(({ group, items }) => (
        <SettingsGroup key={group} title={t(`lists.group.${group}`)}>
          {items.map((item) =>
            editing ? (
              <View key={item.id} style={{ paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, gap: spacing.xs }}>
                <AppText style={[type.bodyLarge, { color: colors.text }]}>{item.label}</AppText>
                <View style={[styles.row, styles.end, { gap: spacing.xs }]}>
                  <IconButton icon={ArrowUp} variant="tonal" label={t('lists.up', { label: item.label })} onPress={() => store().move(id, item.id, 'up')} />
                  <IconButton icon={ArrowDown} variant="tonal" label={t('lists.down', { label: item.label })} onPress={() => store().move(id, item.id, 'down')} />
                  <IconButton icon={Trash} variant="tonal" color={colors.danger} label={t('lists.remove', { label: item.label })} onPress={() => store().remove(id, item.id)} />
                </View>
              </View>
            ) : (
              <CheckRow key={item.id} item={item} onToggle={() => toggle(item)} />
            ),
          )}
          {editing ? (
            <View style={[styles.row, styles.wrap, { gap: spacing.sm, padding: spacing.md }]}>
              <TextInput
                accessibilityLabel={t('lists.addLabel', { group: t(`lists.group.${group}`) })}
                placeholder={t('lists.addPlaceholder')}
                placeholderTextColor={colors.textMuted}
                value={drafts[group] ?? ''}
                onChangeText={(text) => setDrafts((d) => ({ ...d, [group]: text }))}
                onSubmitEditing={() => add(group)}
                returnKeyType="done"
                style={[
                  styles.input,
                  { minHeight: 56, paddingHorizontal: spacing.md, borderRadius: radius.md, borderColor: colors.border, color: colors.text, backgroundColor: colors.surfaceAlt, fontFamily: fonts.body, fontSize: type.bodyLarge.fontSize },
                ]}
              />
              <Button block={false} icon={Plus} label={t('lists.addButton')} accessibilityLabel={t('lists.addButtonLabel', { group: t(`lists.group.${group}`) })} onPress={() => add(group)} />
            </View>
          ) : null}
        </SettingsGroup>
      ))}

      {share ? <Button icon={Share2} label={t('lists.shareText')} onPress={() => void shareText(planText(id, list))} /> : null}
      <Templates id={id} />
      {footer}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  row: { flexDirection: 'row', alignItems: 'center' },
  wrap: { flexWrap: 'wrap' },
  end: { justifyContent: 'flex-end' },
  tick: { width: 28, height: 28, borderRadius: 14, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  input: { flexGrow: 1, flexBasis: 160, borderWidth: 1 },
});
