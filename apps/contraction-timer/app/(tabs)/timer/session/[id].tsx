import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Pressable, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { t } from '@shared/i18n';
import { useTheme } from '@shared/theme';
import { SECOND } from '@/domain/defaults';
import { intervalFor, isIgnored, sessionStats } from '@/domain/stats';
import { sessionStart } from '@/domain/session';
import type { ContractionSession } from '@/domain/types';
import { useAdScreen } from '@/ads/guard';
import { RowEditor, type EditorTarget } from '@/features/history/RowEditor';
import { useSessions } from '@/store/sessions';
import { useSettings } from '@/store/settings';
import { AppText } from '@/ui/AppText';
import { BigButton } from '@/ui/BigButton';
import { clockTime, compact, mmss, shortDate, spoken } from '@/ui/format';
import { Screen } from '@/ui/Screen';
import { ScreenHeader } from '@/ui/ScreenHeader';

export const UNDO_DELETE_MS = 5 * SECOND;

/** Plan §5.2: one session, row by row. Edit, delete (with a 5-second undo), join, add a missed one, share, delete the session. */
export default function SessionDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors, spacing, radius, type } = useTheme();
  useAdScreen('session');
  const clock24h = useSettings((s) => s.settings.clock24h);
  const session = useSessions((s) => (s.active?.id === id ? s.active : (s.archived[id] ?? null)));
  const isOpen = useSessions((s) => s.active?.id === id);
  const [target, setTarget] = useState<EditorTarget | null>(null);
  const [undo, setUndo] = useState<ContractionSession | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );
  const offerUndo = useCallback((before: ContractionSession) => {
    setUndo(before);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setUndo(null), UNDO_DELETE_MS);
  }, []);

  if (!session) {
    return (
      <Screen>
        <ScreenHeader title={t('session.title')} />
        <AppText style={[type.bodyLarge, { color: colors.text }]}>{t('session.notFound')}</AppText>
      </Screen>
    );
  }

  const stats = sessionStats(session.contractions);
  const rows = [...session.contractions].sort((a, b) => b.startedAt - a.startedAt);
  const summary = t('session.stats', {
    count: stats.count,
    length: stats.avgDurationMs === null ? t('stats.none') : compact(stats.avgDurationMs),
    gap: stats.avgIntervalMs === null ? t('stats.none') : t('stats.intervalValue', { time: compact(stats.avgIntervalMs) }),
  });
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
    <Screen>
      <ScreenHeader title={shortDate(sessionStart(session))} />
      <AppText style={[type.bodyLarge, { color: colors.textMuted }]}>{summary}</AppText>
      {isOpen ? <AppText style={[type.body, { color: colors.textMuted }]}>{t('session.inProgressNote')}</AppText> : null}

      <View style={{ gap: spacing.sm }}>
        {rows.map((c) => {
          const running = c.endedAt === null;
          const gap = intervalFor(session.contractions, c.id);
          const ignored = !running && isIgnored(c);
          const length = running ? t('session.running') : mmss((c.endedAt as number) - c.startedAt);
          const spokenLength = running ? t('session.running') : spoken((c.endedAt as number) - c.startedAt);
          const label = t('session.rowLabel', {
            start: clockTime(c.startedAt, clock24h),
            length: spokenLength,
            gap: gap === null ? t('session.noGap') : t('session.gapAfter', { gap: spoken(gap) }),
            strength: c.intensity ? t(`intensity.${c.intensity}`) : t('session.noStrength'),
          });
          return (
            <Pressable
              key={c.id}
              accessibilityRole="button"
              accessibilityLabel={ignored ? `${label}. ${t('session.leftOut')}` : label}
              accessibilityHint={running ? undefined : t('session.editHint')}
              disabled={running}
              onPress={() => setTarget({ mode: 'edit', contraction: c })}
              style={({ pressed }) => ({
                minHeight: 72,
                padding: spacing.md,
                borderRadius: radius.lg,
                borderWidth: 1,
                borderColor: colors.border,
                backgroundColor: pressed ? colors.surfaceAlt : colors.surface,
                opacity: ignored ? 0.6 : 1,
                gap: 2,
              })}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md }}>
                <AppText style={[type.bodyLarge, { color: colors.text, fontWeight: '700' }]}>{clockTime(c.startedAt, clock24h)}</AppText>
                <AppText style={[type.bodyLarge, { color: colors.text, fontWeight: '700', fontVariant: ['tabular-nums'] }]}>{length}</AppText>
              </View>
              <AppText style={[type.body, { color: colors.textMuted }]}>
                {[gap === null ? t('session.noGap') : t('session.gapAfter', { gap: compact(gap) }), c.intensity ? t(`intensity.${c.intensity}`) : null, ignored ? t('session.leftOut') : null].filter(Boolean).join(' · ')}
              </AppText>
              {c.note ? <AppText style={[type.body, { color: colors.text }]}>{c.note}</AppText> : null}
            </Pressable>
          );
        })}
      </View>

      {undo ? (
        <View accessibilityLiveRegion="polite" style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md, borderRadius: radius.md, backgroundColor: colors.text, minHeight: 64 }}>
          <AppText style={[type.bodyLarge, { color: colors.background, flex: 1, fontWeight: '700' }]}>{t('session.deleted')}</AppText>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('session.undo')}
            onPress={() => {
              useSessions.getState().restoreSession(undo);
              setUndo(null);
            }}
            style={{ minHeight: 56, minWidth: 96, alignItems: 'center', justifyContent: 'center', borderRadius: radius.md, backgroundColor: colors.background }}
          >
            <AppText style={[type.bodyLarge, { color: colors.text, fontWeight: '700' }]}>{t('session.undo')}</AppText>
          </Pressable>
        </View>
      ) : null}

      <BigButton tall label={t('session.share')} onPress={() => router.push({ pathname: '/modals/share-summary', params: { id: session.id } })} />
      <BigButton variant="secondary" label={t('session.add')} onPress={() => setTarget({ mode: 'add', startedAt: Math.min(Date.now() - 60 * SECOND, lastEnd + 5 * 60 * SECOND) })} />
      {!isOpen ? <BigButton variant="secondary" label={t('session.delete')} onPress={confirmDelete} /> : null}

      <RowEditor sessionId={session.id} target={target} onClose={() => setTarget(null)} onDeleted={offerUndo} />
    </Screen>
  );
}
