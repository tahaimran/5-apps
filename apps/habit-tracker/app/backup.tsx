import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { Stack } from 'expo-router';
import { t } from '@shared/i18n';
import { useTheme } from '@shared/theme';
import { exportBackup, pickBackup, restoreBackup } from '@/features/backup/files';
import type { BackupSummary } from '@/domain/backup';
import type { BackupFile } from '@/domain/types';
import { Screen } from '@/ui/Screen';
import { PrimaryButton, TextButton } from '@/ui/controls';

type Pending = { backup: BackupFile; summary: BackupSummary };

export default function Backup() {
  const { colors, spacing, radius, type } = useTheme();
  const [pending, setPending] = useState<Pending | null>(null);
  const [message, setMessage] = useState<{ text: string; error: boolean } | null>(null);

  const onExport = async () => {
    setMessage(null);
    try {
      await exportBackup();
    } catch {
      setMessage({ text: t('backup.exportFailed'), error: true });
    }
  };

  const onImport = async () => {
    setMessage(null);
    setPending(null);
    const result = await pickBackup();
    if (result.kind === 'canceled') return;
    if (result.kind === 'unreadable') return setMessage({ text: t('backup.pickFailed'), error: true });
    if (!result.ok) return setMessage({ text: t(`backup.errors.${result.error}`), error: true });
    setPending({ backup: result.backup, summary: result.summary });
  };

  const confirmRestore = () => {
    if (!pending) return;
    Alert.alert(t('backup.previewTitle'), `${t('backup.preview', { ...pending.summary })}\n${t('backup.replaceWarning')}`, [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('backup.restore'),
        style: 'destructive',
        onPress: () => {
          restoreBackup(pending.backup);
          setPending(null);
          setMessage({ text: t('backup.done'), error: false });
        },
      },
    ]);
  };

  const card = (title: string, body: string, action: React.ReactNode) => (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.md, padding: spacing.lg, gap: spacing.sm }]}>
      <Text accessibilityRole="header" style={[type.bodyLarge, { color: colors.text, fontWeight: '600' }]}>{title}</Text>
      <Text style={[type.body, { color: colors.textMuted }]}>{body}</Text>
      {action}
    </View>
  );

  return (
    <Screen>
      <Stack.Screen options={{ title: t('backup.title'), headerShown: true }} />
      <Text style={[type.body, { color: colors.textMuted }]}>{t('backup.intro')}</Text>

      {card(t('backup.export'), t('backup.exportBody'), <PrimaryButton label={t('backup.export')} onPress={onExport} />)}
      {card(t('backup.import'), t('backup.importBody'), <PrimaryButton label={t('backup.import')} onPress={onImport} />)}

      {pending && (
        <View style={[styles.card, { backgroundColor: colors.surfaceAlt, borderColor: colors.border, borderRadius: radius.md, padding: spacing.lg, gap: spacing.sm }]}>
          <Text accessibilityRole="header" style={[type.bodyLarge, { color: colors.text, fontWeight: '600' }]}>{t('backup.previewTitle')}</Text>
          <Text style={[type.title, { color: colors.text }]}>{t('backup.preview', { ...pending.summary })}</Text>
          {pending.backup.exportedAt !== '' && (
            <Text style={[type.caption, { color: colors.textMuted }]}>
              {t('backup.exportedAt', { date: new Date(pending.backup.exportedAt).toLocaleDateString() })}
            </Text>
          )}
          <Text style={[type.body, { color: colors.textMuted }]}>{t('backup.replaceWarning')}</Text>
          <PrimaryButton label={t('backup.restore')} onPress={confirmRestore} />
          <TextButton label={t('common.cancel')} onPress={() => setPending(null)} />
        </View>
      )}

      {message && (
        <Text accessibilityLiveRegion="polite" style={[type.body, { color: message.error ? colors.danger : colors.success, fontWeight: '600' }]}>
          {message.text}
        </Text>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: StyleSheet.hairlineWidth },
});
