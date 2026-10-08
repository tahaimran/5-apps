import { View } from 'react-native';
import { router } from 'expo-router';
import { t } from '@shared/i18n';
import { useTheme } from '@shared/theme';
import { adContext } from '@/ads/guard';
import { decide, PLACEMENTS } from '@/domain/adRules';
import { useAds } from '@/store/ads';
import { AppText } from '@/ui/AppText';
import { BigButton } from '@/ui/BigButton';
import { Screen } from '@/ui/Screen';

/**
 * Development-only overlay (plan milestone 7: "verify caps with a debug overlay"): the counters the
 * ad rules read and, for each placement, whether it would show right now and why not.
 */
export default function DebugAds() {
  const { colors, spacing, radius, type } = useTheme();
  useAds((s) => s.counters); // re-render when counters change
  const c = adContext();
  const ago = (at: number) => (at > 0 ? `${Math.round((c.now - at) / 1000)} s ago` : 'never');
  const rows: [string, string][] = [
    ['setupDone', String(c.setupDone)],
    ['firstSession', String(c.firstSession)],
    ['puzzlesCompleted', String(c.puzzlesCompleted)],
    ['screen', c.screen],
    ['puzzleInProgress', String(c.puzzleInProgress)],
    ['levelsSinceInterstitial', String(c.levelsSinceInterstitial)],
    ['lastFullScreen', ago(c.lastFullScreenAt)],
    ['lastRewarded', ago(c.lastRewardedAt)],
    ['lastAppOpen', ago(c.lastAppOpenAt)],
    ['interstitials (last hour)', String(c.interstitialTimes.filter((x) => c.now - x < 3_600_000).length)],
  ];
  return (
    <Screen>
      <AppText accessibilityRole="header" style={[type.headline, { color: colors.text, fontWeight: '700' }]}>{t('adDebug.title')}</AppText>
      <AppText style={[type.body, { color: colors.textMuted }]}>{t('adDebug.intro')}</AppText>
      {PLACEMENTS.map((p) => {
        const d = decide(p, c);
        return (
          <View key={p} accessible style={{ padding: spacing.md, borderRadius: radius.lg, borderWidth: 2, borderColor: d.allowed ? colors.success : colors.border, backgroundColor: colors.surface, gap: 2 }}>
            <AppText style={[type.bodyLarge, { color: colors.text, fontWeight: '700' }]}>{`${p}: ${d.allowed ? t('adDebug.allowed') : t('adDebug.blocked')}`}</AppText>
            {d.reasons.map((r) => (
              <AppText key={r} style={[type.body, { color: colors.textMuted }]}>{`• ${r}`}</AppText>
            ))}
          </View>
        );
      })}
      <AppText accessibilityRole="header" style={[type.title, { color: colors.text, fontWeight: '700' }]}>{t('adDebug.counters')}</AppText>
      {rows.map(([k, v]) => (
        <AppText key={k} style={[type.body, { color: colors.text }]}>{`${k}: ${v}`}</AppText>
      ))}
      <BigButton variant="secondary" label={t('adDebug.back')} onPress={() => router.back()} />
    </Screen>
  );
}
