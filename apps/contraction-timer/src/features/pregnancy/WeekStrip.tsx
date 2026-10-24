import { useState } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';
import ChevronLeft from 'lucide-react-native/icons/chevron-left';
import ChevronRight from 'lucide-react-native/icons/chevron-right';
import { t } from '@shared/i18n';
import { useTheme } from '@shared/theme';
import { Card, IconButton, PressableScale } from '@shared/ui';
import { FIRST_WEEK, LAST_WEEK } from '@/domain/weeks';
import { useStrongFill } from '@/theme/mode';
import { AppText } from '@/ui/AppText';

/** Weeks shown at once. */
export const STRIP = 5;
/** The first week of the window that shows `week` in the middle (kept inside the weeks that have cards). */
export const stripStart = (week: number) => Math.max(FIRST_WEEK, Math.min(LAST_WEEK - STRIP + 1, week - Math.floor(STRIP / 2)));

/**
 * A strip of weeks (the reference's date strip): five at a time with this week as a tall teal pill,
 * arrows to page through, and a tap on any week to open its card.
 */
export function WeekStrip({ current, title, subtitle }: { current: number | null; title: string; subtitle?: string }) {
  const { colors, spacing, radius, type, fonts } = useTheme();
  const strong = useStrongFill();
  const { fontScale } = useWindowDimensions();
  // The pills are a fixed shape: their numbers keep their drawn size (each pill has a spoken name).
  const fit = (sp: number) => Math.round(sp / Math.max(1, fontScale));
  const [start, setStart] = useState(() => stripStart(current ?? FIRST_WEEK));
  const weeks = Array.from({ length: STRIP }, (_, i) => start + i);
  const page = (dir: 1 | -1) => setStart((s) => Math.max(FIRST_WEEK, Math.min(LAST_WEEK - STRIP + 1, s + dir * STRIP)));
  return (
    <Card style={{ gap: spacing.md, paddingHorizontal: spacing.md }}>
      <View style={[styles.row, { gap: spacing.xs, paddingLeft: spacing.sm }]}>
        <View style={styles.flex}>
          <AppText accessibilityRole="header" style={[type.bodyLarge, { color: colors.text, fontWeight: '700' }]}>
            {title}
          </AppText>
          {subtitle ? <AppText style={[type.body, { color: colors.textMuted }]}>{subtitle}</AppText> : null}
        </View>
        <IconButton icon={ChevronLeft} variant="tonal" size={20} label={t('pregnancy.stripEarlier')} disabled={start <= FIRST_WEEK} onPress={() => page(-1)} />
        <IconButton icon={ChevronRight} variant="tonal" size={20} label={t('pregnancy.stripLater')} disabled={start >= LAST_WEEK - STRIP + 1} onPress={() => page(1)} />
      </View>
      <View style={[styles.row, { gap: spacing.xs }]}>
        {weeks.map((w) => {
          const on = w === current;
          return (
            <PressableScale
              key={w}
              accessibilityRole="button"
              accessibilityLabel={t(on ? 'pregnancy.stripWeekCurrent' : 'pregnancy.stripWeek', { n: w })}
              onPress={() => router.push({ pathname: '/pregnancy/week/[n]', params: { n: String(w) } })}
              scaleTo={0.94}
              style={[styles.pill, { minHeight: on ? 88 : 76, borderRadius: radius.pill, backgroundColor: on ? strong.bg : colors.surfaceAlt, paddingVertical: spacing.sm }]}
            >
              <AppText style={{ fontSize: fit(11), lineHeight: fit(14), color: on ? strong.fg : colors.textMuted, fontFamily: fonts.body, fontWeight: '700', textTransform: 'uppercase' }}>
                {t('pregnancy.wk')}
              </AppText>
              <AppText style={{ fontSize: fit(20), lineHeight: fit(26), color: on ? strong.fg : colors.text, fontFamily: fonts.display, fontWeight: '800' }}>{String(w)}</AppText>
              {on ? <View style={[styles.dot, { backgroundColor: strong.fg }]} /> : null}
            </PressableScale>
          );
        })}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  row: { flexDirection: 'row', alignItems: 'center' },
  pill: { flex: 1, minWidth: 56, alignItems: 'center', justifyContent: 'center', gap: 2 },
  dot: { width: 5, height: 5, borderRadius: 3, marginTop: 2 },
});
