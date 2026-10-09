import { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { t } from '@shared/i18n';
import { useTheme } from '@shared/theme';
import { watchRewarded } from '@/ads/rewarded';
import { PDF_THEME_IDS, PDF_THEMES, type PdfThemeId } from '@/domain/pdf';
import { isPdfThemeUnlocked, useUnlocks } from '@/store/unlocks';
import { AppText } from '@/ui/AppText';
import { BigButton } from '@/ui/BigButton';
import { Screen } from '@/ui/Screen';
import { ScreenHeader } from '@/ui/ScreenHeader';
import { Toast } from '@/ui/Toast';

/**
 * Plan §12 `pdf_theme_reward`: "Clean" is free for ever. Another look is unlocked for good by watching one short video that the
 * person chose to watch; the button says "Available after your session" and does nothing while a session or kick count is open.
 */
export default function PdfThemePicker() {
  const { colors, spacing, radius, type } = useTheme();
  const unlocks = useUnlocks((s) => s.unlocks);
  const selected = useUnlocks((s) => s.selectedPdfTheme);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const unlock = async (id: PdfThemeId) => {
    setBusy(true);
    const result = await watchRewarded('pdf_theme_reward');
    setBusy(false);
    if (result === 'earned') {
      useUnlocks.getState().unlockPdfTheme(id);
      setMessage(t('unlock.unlocked', { name: t(`pdfTheme.${id}`) }));
    } else setMessage(t(result === 'blocked' ? 'unlock.blocked' : 'unlock.failed'));
  };

  return (
    <Screen>
      <ScreenHeader title={t('pdfThemeScreen.title')} onBack={() => router.back()} />
      <AppText style={[type.bodyLarge, { color: colors.textMuted }]}>{t('pdfThemeScreen.intro')}</AppText>
      {PDF_THEME_IDS.map((id) => {
        const open = isPdfThemeUnlocked(unlocks, id);
        const name = t(`pdfTheme.${id}`);
        const inUse = open && selected === id;
        return (
          <View key={id} style={{ gap: spacing.sm, padding: spacing.md, borderRadius: radius.lg, borderWidth: inUse ? 3 : 1, borderColor: inUse ? colors.text : colors.border, backgroundColor: colors.surface }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
              <MaterialCommunityIcons accessible={false} name={open ? 'check-circle-outline' : 'lock-outline'} size={28} color={colors.text} />
              <AppText style={[type.bodyLarge, { color: colors.text, fontWeight: '700', flex: 1 }]}>{name}</AppText>
              <AppText style={[type.body, { color: colors.textMuted }]}>{PDF_THEMES[id].free ? t('unlock.free') : open ? t('unlock.open') : t('unlock.locked')}</AppText>
            </View>
            {open ? (
              <BigButton variant={inUse ? 'secondary' : 'primary'} label={inUse ? t('unlock.inUse') : t('unlock.use')} accessibilityLabel={`${name}. ${inUse ? t('unlock.inUse') : t('unlock.use')}`} onPress={() => useUnlocks.getState().selectPdfTheme(id)} />
            ) : (
              <BigButton label={t('unlock.watch')} accessibilityLabel={t('unlock.watchLabel', { name })} disabled={busy} onPress={() => void unlock(id)} />
            )}
          </View>
        );
      })}
      {message ? <Toast message={message} /> : null}
    </Screen>
  );
}
