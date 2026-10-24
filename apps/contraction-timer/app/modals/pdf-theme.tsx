import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import CircleCheck from 'lucide-react-native/icons/circle-check';
import Lock from 'lucide-react-native/icons/lock';
import PlayCircle from 'lucide-react-native/icons/circle-play';
import Sparkles from 'lucide-react-native/icons/sparkles';
import TriangleAlert from 'lucide-react-native/icons/triangle-alert';
import { t } from '@shared/i18n';
import { useTheme } from '@shared/theme';
import { Button, Card, showToast } from '@shared/ui';
import { watchRewarded } from '@/ads/rewarded';
import { PDF_THEME_IDS, PDF_THEMES, type PdfThemeId } from '@/domain/pdf';
import { isPdfThemeUnlocked, useUnlocks } from '@/store/unlocks';
import { AppText } from '@/ui/AppText';
import { Screen } from '@/ui/Screen';
import { IconCircle } from '@/ui/SettingsRow';

/**
 * Plan §12 `pdf_theme_reward`: "Clean" is free for ever. Another look is unlocked for good by watching one short video that the
 * person chose to watch; the button says "Available after your session" and does nothing while a session or kick count is open.
 */
export default function PdfThemePicker() {
  const { colors, spacing, type } = useTheme();
  const unlocks = useUnlocks((s) => s.unlocks);
  const selected = useUnlocks((s) => s.selectedPdfTheme);
  const [busy, setBusy] = useState(false);

  const unlock = async (id: PdfThemeId) => {
    setBusy(true);
    const result = await watchRewarded('pdf_theme_reward');
    setBusy(false);
    if (result === 'earned') {
      useUnlocks.getState().unlockPdfTheme(id);
      showToast({ message: t('unlock.unlocked', { name: t(`pdfTheme.${id}`) }), icon: Sparkles, tone: 'success' });
    } else showToast({ message: t(result === 'blocked' ? 'unlock.blocked' : 'unlock.failed'), icon: TriangleAlert, tone: 'warning' });
  };

  return (
    <Screen modal title={t('pdfThemeScreen.title')} onBack={() => router.back()}>
      <AppText style={[type.bodyLarge, { color: colors.textMuted }]}>{t('pdfThemeScreen.intro')}</AppText>
      {PDF_THEME_IDS.map((id) => {
        const open = isPdfThemeUnlocked(unlocks, id);
        const name = t(`pdfTheme.${id}`);
        const inUse = open && selected === id;
        return (
          <Card key={id} style={[{ gap: spacing.md, borderWidth: 2, borderColor: inUse ? colors.primary : colors.surface }]}>
            <View style={[styles.row, { gap: spacing.md }]}>
              <IconCircle icon={open ? CircleCheck : Lock} tint={open ? colors.primary : colors.textMuted} bg={open ? colors.primarySoft : colors.surfaceAlt} />
              <AppText style={[type.bodyLarge, styles.flex, { color: colors.text, fontWeight: '700' }]}>{name}</AppText>
              <AppText style={[type.body, { color: colors.textMuted }]}>{PDF_THEMES[id].free ? t('unlock.free') : open ? t('unlock.open') : t('unlock.locked')}</AppText>
            </View>
            {open ? (
              <Button
                variant={inUse ? 'secondary' : 'primary'}
                label={inUse ? t('unlock.inUse') : t('unlock.use')}
                accessibilityLabel={`${name}. ${inUse ? t('unlock.inUse') : t('unlock.use')}`}
                onPress={() => useUnlocks.getState().selectPdfTheme(id)}
              />
            ) : (
              <Button icon={PlayCircle} label={t('unlock.watch')} accessibilityLabel={t('unlock.watchLabel', { name })} disabled={busy} onPress={() => void unlock(id)} />
            )}
          </Card>
        );
      })}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  row: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' },
});
