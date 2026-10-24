import { useMemo, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import FileText from 'lucide-react-native/icons/file-text';
import MessageSquareText from 'lucide-react-native/icons/message-square-text';
import Palette from 'lucide-react-native/icons/palette';
import TriangleAlert from 'lucide-react-native/icons/triangle-alert';
import { t } from '@shared/i18n';
import { useTheme } from '@shared/theme';
import { Button, Card, showToast } from '@shared/ui';
import { buildPdfHtml } from '@/domain/pdf';
import { profileEdd } from '@/domain/dueDate';
import { buildTextSummary } from '@/domain/summary';
import { pdfSupported, sharePdf, shareText } from '@/export/share';
import { planText } from '@/features/checklists/ChecklistScreen';
import { useChecklists } from '@/store/checklists';
import { useProfile } from '@/store/profile';
import { useSessions } from '@/store/sessions';
import { usePdfTheme } from '@/store/unlocks';
import { AppText } from '@/ui/AppText';
import { useClock24h } from '@/ui/format';
import { Screen } from '@/ui/Screen';
import { NavRow, SettingsGroup, SwitchRow } from '@/ui/SettingsRow';

/**
 * Plan F8, F9: the plain-text and PDF summaries. Both are made on the phone; the share sheet decides where they
 * go. Times follow the clock style chosen in Settings. A build without expo-print shares the text instead.
 */
export default function ShareSummary() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors, spacing, type } = useTheme();
  const session = useSessions((s) => (s.active?.id === id ? s.active : (s.archived[id] ?? null)));
  const profile = useProfile((s) => s.profile);
  const clock24h = useClock24h();
  const pdfTheme = usePdfTheme();
  const [busy, setBusy] = useState(false);
  const [withPlan, setWithPlan] = useState(false);
  const plan = useChecklists((s) => s.lists.birthPlan);
  const hasPlan = !!plan && plan.items.some((i) => i.checked);

  const input = useMemo(() => (session ? { session, edd: profileEdd(profile), clock24h, now: Date.now() } : null), [session, profile, clock24h]);
  const text = useMemo(() => (input ? buildTextSummary(input, undefined, withPlan && hasPlan ? planText('birthPlan') : undefined) : ''), [input, withPlan, hasPlan]);

  if (!session || !input) {
    return (
      <Screen modal title={t('share.title')}>
        <AppText style={[type.bodyLarge, { color: colors.text }]}>{t('session.notFound')}</AppText>
      </Screen>
    );
  }

  const warn = (key: string) => showToast({ message: t(key), icon: TriangleAlert, tone: 'warning', duration: 5000 });
  const onText = async () => {
    // The time of the summary is read when the button is pressed, not when the screen opened.
    const fresh = buildTextSummary({ ...input, now: Date.now() }, undefined, withPlan && hasPlan ? planText('birthPlan') : undefined);
    if (!(await shareText(fresh))) warn('share.textFailed');
  };
  const onPdf = async () => {
    if (!pdfSupported()) {
      warn('share.pdfFallback');
      return onText();
    }
    setBusy(true);
    const result = await sharePdf(buildPdfHtml({ ...input, now: Date.now() }, pdfTheme.id));
    setBusy(false);
    if (result === 'error') warn('share.pdfFailed');
    if (result === 'unavailable') warn('share.pdfUnavailable');
  };

  return (
    <Screen modal title={t('share.title')} onBack={() => router.back()}>
      <AppText style={[type.bodyLarge, { color: colors.textMuted }]}>{t('share.intro')}</AppText>
      <Button icon={MessageSquareText} label={t('share.text')} onPress={() => void onText()} />
      <Button variant="secondary" icon={FileText} label={t('share.pdf')} loading={busy} onPress={() => void onPdf()} />
      <SettingsGroup>
        {hasPlan ? <SwitchRow label={t('lists.includePlan')} value={withPlan} onChange={setWithPlan} /> : null}
        <NavRow icon={Palette} label={t('pdfThemeScreen.more')} value={t(`pdfTheme.${pdfTheme.id}`)} onPress={() => router.push('/modals/pdf-theme')} />
      </SettingsGroup>
      <AppText accessibilityRole="header" style={[type.title, { color: colors.text, fontWeight: '800', marginTop: spacing.sm }]}>{t('share.preview')}</AppText>
      <Card level={0} style={{ backgroundColor: colors.surfaceAlt }}>
        <AppText selectable style={[type.body, { color: colors.text }]}>
          {text}
        </AppText>
      </Card>
    </Screen>
  );
}
