import { StyleSheet, View } from 'react-native';
import ChartColumn from 'lucide-react-native/icons/chart-column';
import CircleCheck from 'lucide-react-native/icons/circle-check';
import Flame from 'lucide-react-native/icons/flame';
import Layers2 from 'lucide-react-native/icons/layers-2';
import Sparkles from 'lucide-react-native/icons/sparkles';
import Target from 'lucide-react-native/icons/target';
import Trophy from 'lucide-react-native/icons/trophy';
import Zap from 'lucide-react-native/icons/zap';
import { t } from '@shared/i18n';
import { useTheme } from '@shared/theme';
import { Card } from '@shared/ui';
import { useAdScreen } from '@/ads/guard';
import { CATEGORIES } from '@/domain/categories';
import { levelProgress, titleFor } from '@/domain/scoring';
import { useDaily, useProfile, useStats, useStreak } from '@/store/stores';
import { extraColorsFor } from '@/theme/tokens';
import { AppText } from '@/ui/AppText';
import { BannerSlot } from '@/ui/BannerSlot';
import { categoryTone } from '@/ui/categoryTone';
import { categoryIcons } from '@/ui/icons';
import { ProgressBar } from '@/ui/ProgressBar';
import { Screen } from '@/ui/Screen';
import { IconCircle, StatTile } from '@/ui/SettingsRow';

/** The Stats content (plan §5): level, totals, best streak, Blitz best and accuracy per category. Empty until a round is played. */
export function StatsContent() {
  const { colors, spacing, mode } = useTheme();
  const x = extraColorsFor(mode);
  const stats = useStats((s) => s.value);
  const streak = useStreak((s) => s.value);
  const profile = useProfile((s) => s.value);
  const daily = useDaily((s) => s.value);
  const progress = levelProgress(profile.xp);
  if (stats.answered === 0 && daily.history.length === 0) {
    return (
      <Card style={[styles.empty, { gap: spacing.md }]}>
        <IconCircle icon={ChartColumn} size={64} />
        <AppText accessibilityLiveRegion="polite" variant="body" style={[styles.center, { color: colors.textMuted }]}>
          {t('stats.empty')}
        </AppText>
      </Card>
    );
  }
  const accuracy = stats.answered === 0 ? 0 : Math.round((stats.correct / stats.answered) * 100);
  const title = t(`titles.${titleFor(progress.level)}`);
  return (
    <View style={{ gap: spacing.md }}>
      <Card style={{ gap: spacing.sm }}>
        <View style={[styles.row, { gap: spacing.md }]}>
          <IconCircle icon={Trophy} tint={colors.accent} bg={x.goldSoft} size={44} />
          <View style={styles.flex}>
            <AppText variant="h2">{t('home.level', { level: progress.level, title })}</AppText>
            <AppText variant="caption" style={{ color: colors.textMuted, fontWeight: '600' }}>
              {t('home.xp', { into: progress.into, need: progress.need })}
            </AppText>
          </View>
        </View>
        <ProgressBar fraction={progress.fraction} color={x.gold} />
      </Card>
      <View style={[styles.row, { gap: spacing.md }]}>
        <StatTile icon={CircleCheck} value={String(stats.answered)} label={t('stats.answered')} tint={colors.success} bg={x.successSoft} />
        <StatTile icon={Target} value={`${accuracy}%`} label={t('stats.accuracy')} />
      </View>
      <View style={[styles.row, { gap: spacing.md }]}>
        <StatTile icon={Flame} value={String(streak.best)} label={t('stats.bestStreak')} tint={x.streak} bg={x.streakSoft} />
        <StatTile icon={Zap} value={String(stats.blitzBest)} label={t('stats.blitzBest')} tint={colors.accent} bg={x.goldSoft} />
      </View>
      <View style={[styles.row, { gap: spacing.md }]}>
        <StatTile icon={Layers2} value={String(stats.roundsPlayed)} label={t('stats.rounds')} />
        <StatTile icon={Sparkles} value={String(profile.xp)} label={t('stats.totalXp')} tint={colors.accent} bg={x.goldSoft} />
      </View>

      <AppText variant="h2" accessibilityRole="header" style={{ marginTop: spacing.sm }}>
        {t('stats.byCategory')}
      </AppText>
      <Card style={{ gap: spacing.lg }}>
        {CATEGORIES.map((c) => {
          const s = stats.byCategory[c.id] ?? { a: 0, c: 0 };
          const pct = s.a === 0 ? 0 : Math.round((s.c / s.a) * 100);
          const text = s.a === 0 ? t('stats.noAnswers') : t('stats.categoryLine', { percent: pct, answered: s.a });
          const tone = categoryTone(c.id, mode);
          return (
            <View key={c.id} accessible accessibilityLabel={`${t(`categories.${c.id}`)}: ${text}`} style={[styles.row, { gap: spacing.md }]}>
              <IconCircle icon={categoryIcons[c.id]} tint={tone.icon} bg={tone.soft} />
              <View style={[styles.flex, { gap: 6 }]}>
                <View style={[styles.row, { justifyContent: 'space-between', gap: spacing.sm }]}>
                  <AppText variant="body" style={styles.bold} numberOfLines={1}>
                    {t(`categories.${c.id}`)}
                  </AppText>
                  <AppText variant="caption" style={{ color: colors.textMuted, fontWeight: '600' }}>
                    {text}
                  </AppText>
                </View>
                <ProgressBar fraction={pct / 100} color={tone.icon} height={8} />
              </View>
            </View>
          );
        })}
      </Card>
    </View>
  );
}

export default function Stats() {
  useAdScreen('stats');
  return (
    <Screen title={t('stats.title')} footer={<BannerSlot placement="menu" />}>
      <StatsContent />
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  row: { flexDirection: 'row', alignItems: 'center' },
  bold: { fontWeight: '700', flexShrink: 1 },
  center: { textAlign: 'center' },
  empty: { alignItems: 'center', paddingVertical: 32 },
});
