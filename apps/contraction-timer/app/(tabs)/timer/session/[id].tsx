import { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import EyeOff from 'lucide-react-native/icons/eye-off';
import Hash from 'lucide-react-native/icons/hash';
import Hourglass from 'lucide-react-native/icons/hourglass';
import Plus from 'lucide-react-native/icons/plus';
import Repeat from 'lucide-react-native/icons/repeat';
import Share2 from 'lucide-react-native/icons/share-2';
import Trash from 'lucide-react-native/icons/trash';
import { t } from '@shared/i18n';
import { useTheme } from '@shared/theme';
import { Button, PressableScale, showToast } from '@shared/ui';
import { SECOND } from '@/domain/defaults';
import { intervalFor, isIgnored, sessionStats } from '@/domain/stats';
import { sessionStart } from '@/domain/session';
import type { ContractionSession } from '@/domain/types';
import { useAdScreen } from '@/ads/guard';
import { RowEditor, type EditorTarget } from '@/features/history/RowEditor';
import { useSessions } from '@/store/sessions';
import { useAppColors } from '@/theme/mode';
import { AppText } from '@/ui/AppText';
import { clockTime, compact, mmss, shortDate, spoken, useClock24h } from '@/ui/format';
import { Screen } from '@/ui/Screen';
import { StatTile } from '@/ui/SettingsRow';

export const UNDO_DELETE_MS = 5 * SECOND;

/** Plan §5.2: one session, row by row. Edit, delete (with a 5-second undo), join, add a missed one, share, delete the session. */
export default function SessionDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors, spacing, radius, type, shadow, fonts } = useTheme();
  const app = useAppColors();
  useAdScreen('session');
  const clock24h = useClock24h();
  const session = useSessions((s) => (s.active?.id === id ? s.active : (s.archived[id] ?? null)));
  const isOpen = useSessions((s) => s.active?.id === id);
  const [target, setTarget] = useState<EditorTarget | null>(null);

  // A deleted row can be put back for 5 seconds (plan F7), from a toast with an Undo action.
  const offerUndo = (before: ContractionSession) =>
    showToast({
      message: t('session.deleted'),
      icon: Trash,
      duration: UNDO_DELETE_MS,
      action: { label: t('session.undo'), onPress: () => useSessions.getState().restoreSession(before) },
    });

  if (!session) {
    return (
      <Screen stack title={t('session.title')}>
        <AppText style={[type.bodyLarge, { color: colors.text }]}>{t('session.notFound')}</AppText>
      </Screen>
    );
  }

  const stats = sessionStats(session.contractions);
  const rows = [...session.contractions].sort((a, b) => b.startedAt - a.startedAt);
  const length = stats.avgDurationMs === null ? t('stats.none') : compact(stats.avgDurationMs);
  const gapText = stats.avgIntervalMs === null ? t('stats.none') : t('stats.intervalValue', { time: compact(stats.avgIntervalMs) });
  const lastEnd = Math.max(0, ...session.contractions.map((c) => c.endedAt ?? c.startedAt));

  const confirmDelete = () =>
    Alert.alert(t('session.deleteTitle'), t('session.deleteBody'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('session.deleteConfirm'),
        style: 'destructive',
        onPress: () => {
          useSessions.getState().deleteSession(session.id);
          router.back();
        },
      },
    ]);

  return (
    <Screen stack title={shortDate(sessionStart(session))}>
      <View accessible accessibilityLabel={t('session.stats', { count: stats.count, length, gap: gapText })} style={[styles.row, { gap: spacing.sm }]}>
        <StatTile icon={Hash} label={t('session.countTitle')} value={String(stats.count)} />
        <StatTile icon={Hourglass} label={t('stats.lengthTitle')} value={length} tint={app.activeText} bg={app.activeSoft} />
        <StatTile icon={Repeat} label={t('stats.intervalTitle')} value={gapText} tint={colors.accent} bg={colors.surfaceAlt} />
      </View>
      {isOpen ? <AppText style={[type.body, { color: colors.textMuted }]}>{t('session.inProgressNote')}</AppText> : null}

      <View style={{ gap: spacing.sm }}>
        {rows.map((c) => {
          const running = c.endedAt === null;
          const gap = intervalFor(session.contractions, c.id);
          const ignored = !running && isIgnored(c);
          const rowLength = running ? t('session.running') : mmss((c.endedAt as number) - c.startedAt);
          const spokenLength = running ? t('session.running') : spoken((c.endedAt as number) - c.startedAt);
          const label = t('session.rowLabel', {
            start: clockTime(c.startedAt, clock24h),
            length: spokenLength,
            gap: gap === null ? t('session.noGap') : t('session.gapAfter', { gap: spoken(gap) }),
            strength: c.intensity ? t(`intensity.${c.intensity}`) : t('session.noStrength'),
          });
          return (
            <PressableScale
              key={c.id}
              accessibilityRole="button"
              accessibilityLabel={ignored ? `${label}. ${t('session.leftOut')}` : label}
              accessibilityHint={running ? undefined : t('session.editHint')}
              disabled={running}
              onPress={() => setTarget({ mode: 'edit', contraction: c })}
              scaleTo={0.98}
              style={[{ minHeight: 72, padding: spacing.md, paddingHorizontal: spacing.lg, borderRadius: radius.lg, backgroundColor: colors.surface, opacity: ignored ? 0.6 : 1, gap: 2 }, shadow(1)]}
            >
              <View style={[styles.between, { gap: spacing.md }]}>
                <AppText style={[type.bodyLarge, { color: colors.text, fontWeight: '700' }]}>{clockTime(c.startedAt, clock24h)}</AppText>
                <AppText style={[type.bodyLarge, { color: running ? app.activeText : colors.text, fontFamily: fonts.display, fontWeight: '800', fontVariant: ['tabular-nums'] }]}>{rowLength}</AppText>
              </View>
              <View style={[styles.row, { gap: spacing.xs, alignItems: 'center' }]}>
                {ignored ? <EyeOff size={16} color={colors.textMuted} strokeWidth={2.25} /> : null}
                <AppText style={[type.body, styles.flex, { color: colors.textMuted }]}>
                  {[gap === null ? t('session.noGap') : t('session.gapAfter', { gap: compact(gap) }), c.intensity ? t(`intensity.${c.intensity}`) : null, ignored ? t('session.leftOut') : null].filter(Boolean).join(' · ')}
                </AppText>
              </View>
              {c.note ? <AppText style={[type.body, { color: colors.text }]}>{c.note}</AppText> : null}
            </PressableScale>
          );
        })}
      </View>

      <Button icon={Share2} label={t('session.share')} onPress={() => router.push({ pathname: '/modals/share-summary', params: { id: session.id } })} />
      <Button variant="secondary" icon={Plus} label={t('session.add')} onPress={() => setTarget({ mode: 'add', startedAt: Math.min(Date.now() - 60 * SECOND, lastEnd + 5 * 60 * SECOND) })} />
      {!isOpen ? <Button variant="danger" icon={Trash} label={t('session.delete')} onPress={confirmDelete} /> : null}

      <RowEditor sessionId={session.id} target={target} onClose={() => setTarget(null)} onDeleted={offerUndo} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  row: { flexDirection: 'row', flexWrap: 'wrap' },
  between: { flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap' },
});
