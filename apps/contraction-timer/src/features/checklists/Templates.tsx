import { useState } from 'react';
import { View } from 'react-native';
import ListPlus from 'lucide-react-native/icons/list-plus';
import PlayCircle from 'lucide-react-native/icons/circle-play';
import Sparkles from 'lucide-react-native/icons/sparkles';
import TriangleAlert from 'lucide-react-native/icons/triangle-alert';
import { t } from '@shared/i18n';
import { useTheme } from '@shared/theme';
import { Button, showToast } from '@shared/ui';
import { watchRewarded } from '@/ads/rewarded';
import { CHECKLIST_CONTENT } from '@/domain/checklists';
import type { ChecklistId } from '@/domain/types';
import { useChecklists } from '@/store/checklists';
import { useUnlocks } from '@/store/unlocks';
import { AppText } from '@/ui/AppText';

/**
 * Plan §12 `checklist_template_reward`: extra lists (C-section bag, NICU bag, twins, birth-center plan) added to the list for good after
 * one short video the person chose to watch. Unavailable (and does nothing) while a session or kick count is open.
 */
export function Templates({ id }: { id: ChecklistId }) {
  const { colors, spacing, type } = useTheme();
  const unlocked = useUnlocks((s) => s.unlocks.checklistTemplates);
  const [busy, setBusy] = useState(false);
  const templates = CHECKLIST_CONTENT.templates.filter((tpl) => tpl.checklist === id);
  if (templates.length === 0) return null;

  const add = (templateId: string, message = t('unlock.added')) => {
    useChecklists.getState().addTemplate(id, templateId);
    showToast({ message, icon: ListPlus, tone: 'success' });
  };
  const watch = async (templateId: string, name: string) => {
    setBusy(true);
    const result = await watchRewarded('checklist_template_reward');
    setBusy(false);
    if (result === 'earned') {
      useUnlocks.getState().unlockChecklistTemplate(templateId);
      add(templateId, t('lists.templateAdded', { name }));
    } else showToast({ message: t(result === 'blocked' ? 'unlock.blocked' : 'unlock.failed'), icon: TriangleAlert, tone: 'warning' });
  };

  return (
    <View style={{ gap: spacing.sm, marginTop: spacing.md }}>
      <AppText accessibilityRole="header" style={[type.title, { color: colors.text, fontWeight: '800' }]}>{t('lists.templatesTitle')}</AppText>
      <AppText style={[type.body, { color: colors.textMuted }]}>{t('lists.templatesNote')}</AppText>
      {templates.map((tpl) => {
        const name = t(`lists.template.${tpl.id}`);
        const open = unlocked.includes(tpl.id);
        return open ? (
          <Button key={tpl.id} variant="secondary" icon={Sparkles} label={`${name}: ${t('unlock.addList')}`} onPress={() => add(tpl.id)} />
        ) : (
          <Button key={tpl.id} variant="secondary" icon={PlayCircle} label={t('unlock.watchTemplate', { name })} disabled={busy} onPress={() => void watch(tpl.id, name)} />
        );
      })}
    </View>
  );
}
