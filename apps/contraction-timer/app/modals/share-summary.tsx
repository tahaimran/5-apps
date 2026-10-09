import { useMemo, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { t } from '@shared/i18n';
import { useTheme } from '@shared/theme';
import { buildPdfHtml } from '@/domain/pdf';
import { profileEdd } from '@/domain/dueDate';
import { buildTextSummary } from '@/domain/summary';
import { sharePdf, shareText } from '@/export/share';
import { useProfile } from '@/store/profile';
import { useSessions } from '@/store/sessions';
import { useSettings } from '@/store/settings';
import { usePdfTheme } from '@/store/unlocks';
import { AppText } from '@/ui/AppText';
import { BigButton } from '@/ui/BigButton';
import { Screen } from '@/ui/Screen';
import { ScreenHeader } from '@/ui/ScreenHeader';
import { Toast } from '@/ui/Toast';

/** Plan F8, F9: the plain-text and PDF summaries. Both are made on the phone; the share sheet decides where they go. */
export default function ShareSummary() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors, spacing, radius, type } = useTheme();
  const session = useSessions((s) => (s.active?.id === id ? s.active : (s.archived[id] ?? null)));
  const profile = useProfile((s) => s.profile);
  const clock24h = useSettings((s) => s.settings.clock24h);
  const pdfTheme = usePdfTheme();
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const input = useMemo(() => (session ? { session, edd: profileEdd(profile), clock24h, now: Date.now() } : null), [session, profile, clock24h]);
  const text = useMemo(() => (input ? buildTextSummary(input) : ''), [input]);

  if (!session || !input) {
    return (
      <Screen>
        <ScreenHeader title={t('share.title')} />
        <AppText style={[type.bodyLarge, { color: colors.text }]}>{t('session.notFound')}</AppText>
      </Screen>
    );
  }

  const onText = async () => {
    // The time of the summary is read when the button is pressed, not when the screen opened.
    const fresh = buildTextSummary({ ...input, now: Date.now() });
    if (!(await shareText(fresh))) setMessage(t('share.textFailed'));
  };
  const onPdf = async () => {
    setBusy(true);
    const result = await sharePdf(buildPdfHtml({ ...input, now: Date.now() }, pdfTheme.id));
    setBusy(false);
    if (result === 'error') setMessage(t('share.pdfFailed'));
    if (result === 'unavailable') setMessage(t('share.pdfUnavailable'));
  };

  return (
    <Screen>
      <ScreenHeader title={t('share.title')} onBack={() => router.back()} />
      <AppText style={[type.bodyLarge, { color: colors.textMuted }]}>{t('share.intro')}</AppText>
      <BigButton tall label={t('share.text')} onPress={() => void onText()} />
      <BigButton tall label={t('share.pdf')} disabled={busy} onPress={() => void onPdf()} />
      <AppText style={[type.body, { color: colors.textMuted }]}>{t('share.themeLabel', { name: t(`pdfTheme.${pdfTheme.id}`) })}</AppText>
      {message ? <Toast message={message} /> : null}
      <AppText accessibilityRole="header" style={[type.title, { color: colors.text, fontWeight: '700', marginTop: spacing.md }]}>{t('share.preview')}</AppText>
      <AppText selectable style={[type.body, { color: colors.text, padding: spacing.md, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, fontFamily: undefined }]}>
        {text}
      </AppText>
    </Screen>
  );
}
