import { useState } from 'react';
import { View } from 'react-native';
import { t } from '@shared/i18n';
import { useTheme } from '@shared/theme';
import { watchRewarded } from '@/ads/rewarded';
import { CHECKLIST_CONTENT } from '@/domain/checklists';
import type { ChecklistId } from '@/domain/types';
import { useChecklists } from '@/store/checklists';
import { useUnlocks } from '@/store/unlocks';
import { AppText } from '@/ui/AppText';
import { BigButton } from '@/ui/BigButton';
import { Toast } from '@/ui/Toast';

/**
 * Plan §12 `checklist_template_reward`: extra lists (C-section bag, NICU bag, twins, birth-center plan) added to the list for good after
 * one short video the person chose to watch. Unavailable (and does nothing) while a session or kick count is open.
 */
export function Templates({ id }: { id: ChecklistId }) {
  const { colors, spacing, type } = useTheme();
  const unlocked = useUnlocks((s) => s.unlocks.checklistTemplates);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const templates = CHECKLIST_CONTENT.templates.filter((tpl) => tpl.checklist === id);
  if (templates.length === 0) return null;

  const add = (templateId: string) => {
    useChecklists.getState().addTemplate(id, templateId);
    setMessage(t('unlock.added'));
  };
  const watch = async (templateId: string, name: string) => {
    setBusy(true);
    const result = await watchRewarded('checklist_template_reward');
    setBusy(false);
    if (result === 'earned') {
      useUnlocks.getState().unlockChecklistTemplate(templateId);
      add(templateId);
      setMessage(t('lists.templateAdded', { name }));
    } else setMessage(t(result === 'blocked' ? 'unlock.blocked' : 'unlock.failed'));
  };

  return (
    <View style={{ gap: spacing.sm, marginTop: spacing.md }}>
      <AppText accessibilityRole="header" style={[type.title, { color: colors.text, fontWeight: '700' }]}>{t('lists.templatesTitle')}</AppText>
      <AppText style={[type.body, { color: colors.textMuted }]}>{t('lists.templatesNote')}</AppText>
      {templates.map((tpl) => {
        const name = t(`lists.template.${tpl.id}`);
        const open = unlocked.includes(tpl.id);
        return open ? (
          <BigButton key={tpl.id} variant="secondary" label={`${name}: ${t('unlock.addList')}`} onPress={() => add(tpl.id)} />
        ) : (
          <BigButton key={tpl.id} label={t('unlock.watchTemplate', { name })} disabled={busy} onPress={() => void watch(tpl.id, name)} />
        );
      })}
      {message ? <Toast message={message} /> : null}
    </View>
  );
}
