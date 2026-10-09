import { View } from 'react-native';
import { router } from 'expo-router';
import { t } from '@shared/i18n';
import { useTheme } from '@shared/theme';
import { adContext } from '@/ads/guard';
import { decide, decideRewarded, PLACEMENTS, REWARDED_PLACEMENTS } from '@/domain/adRules';
import { useAds } from '@/store/ads';
import { useKicks } from '@/store/kicks';
import { useSessions } from '@/store/sessions';
import { AppText } from '@/ui/AppText';
import { BigButton } from '@/ui/BigButton';
import { Screen } from '@/ui/Screen';

/**
 * Development-only screen (plan §17 Day 8: "verify caps with a debug overlay"): the values the ad rules read and, for each
 * placement, whether it would show right now and why not. Reached from More only when `__DEV__` is true.
 */
export default function DebugAds() {
  const { colors, spacing, radius, type } = useTheme();
  useAds((s) => s.state); // re-render when the counters change
  useSessions((s) => s.active);
  useKicks((s) => s.active);
  const c = adContext();
  const ago = (at: number) => (at > 0 ? `${Math.round((c.now - at) / 1000)} s ago` : 'never');
  const rows: [string, string][] = [
    ['setupDone', String(c.setupDone)],
    ['launches', String(c.launches)],
    ['installDay / today', `${c.installDay} / ${c.today}`],
    ['screen', c.screen],
    ['sessionOpen', String(c.sessionOpen)],
    ['kickOpen', String(c.kickOpen)],
    ['partnerMode', String(c.partnerMode)],
    ['lastSessionEnded', ago(c.lastSessionEndedAt)],
    ['lastFullScreen', ago(c.lastFullScreenAt)],
    ['lastAppOpen', ago(c.lastAppOpenAt)],
    ['interstitials today', c.interstitialsDay === c.today ? String(c.interstitialsToday) : '0'],
  ];
  const card = (key: string, d: { allowed: boolean; reasons: string[] }) => (
    <View key={key} accessible style={{ padding: spacing.md, borderRadius: radius.lg, borderWidth: 2, borderColor: d.allowed ? colors.text : colors.border, backgroundColor: colors.surface, gap: 2 }}>
      <AppText style={[type.bodyLarge, { color: colors.text, fontWeight: '700' }]}>{`${key}: ${d.allowed ? t('adDebug.allowed') : t('adDebug.blocked')}`}</AppText>
      {d.reasons.map((r) => (
        <AppText key={r} style={[type.body, { color: colors.textMuted }]}>{`• ${r}`}</AppText>
      ))}
    </View>
  );
  return (
    <Screen>
      <AppText accessibilityRole="header" style={[type.headline, { color: colors.text, fontWeight: '700' }]}>{t('adDebug.title')}</AppText>
      <AppText style={[type.body, { color: colors.textMuted }]}>{t('adDebug.intro')}</AppText>
      {PLACEMENTS.filter((p) => !REWARDED_PLACEMENTS.includes(p)).map((p) => card(p, decide(p, c)))}
      {REWARDED_PLACEMENTS.map((p) => card(p, decideRewarded(p, c)))}
      <AppText accessibilityRole="header" style={[type.title, { color: colors.text, fontWeight: '700' }]}>{t('adDebug.counters')}</AppText>
      {rows.map(([k, v]) => (
        <AppText key={k} style={[type.body, { color: colors.text }]}>{`${k}: ${v}`}</AppText>
      ))}
      <BigButton variant="secondary" label={t('adDebug.back')} onPress={() => router.back()} />
    </Screen>
  );
}
