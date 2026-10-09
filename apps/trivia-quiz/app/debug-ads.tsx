import { View } from 'react-native';
import { router } from 'expo-router';
import { t } from '@shared/i18n';
import { useTheme } from '@shared/theme';
import { adContext } from '@/ads/guard';
import { decide, PLACEMENTS } from '@/domain/adRules';
import { useAdCounters } from '@/store/stores';
import { useAds } from '@/store/ads';
import { AppText } from '@/ui/AppText';
import { BigButton } from '@/ui/BigButton';
import { Screen } from '@/ui/Screen';

/**
 * Development-only screen (opened from Settings in dev builds): the counters the ad rules read and,
 * for each placement, whether it would show right now and why not. For checking the caps by hand.
 */
export default function DebugAds() {
  const { colors, spacing, radius } = useTheme();
  useAdCounters((s) => s.value); // re-render when counters change
  useAds((s) => s.screen);
  const c = adContext();
  const ago = (at: number) => (at > 0 ? `${Math.round((c.now - at) / 1000)} s ago` : 'never');
  const rows: [string, string][] = [
    ['onboardingDone', String(c.onboardingDone)],
    ['firstSession', String(c.firstSession)],
    ['sessionAge', `${Math.round(c.sessionAgeMs / 1000)} s`],
    ['installAge', `${(c.installAgeMs / 86_400_000).toFixed(1)} days`],
    ['screen', c.screen],
    ['roundsSinceInterstitial', String(c.roundsSinceInterstitial)],
    ['interstitialsToday', String(c.interstitialsToday)],
    ['lastFullScreen', ago(c.lastFullScreenAt)],
    ['lastRewarded', ago(c.lastRewardedAt)],
    ['lastAppOpen', ago(c.lastAppOpenAt)],
  ];
  return (
    <Screen>
      <AppText variant="h1" accessibilityRole="header">{t('adDebug.title')}</AppText>
      <AppText variant="body" style={{ color: colors.textMuted }}>{t('adDebug.intro')}</AppText>
      {PLACEMENTS.map((p) => {
        const d = decide(p, c);
        return (
          <View key={p} accessible style={{ padding: spacing.md, borderRadius: radius.lg, borderWidth: 2, borderColor: d.allowed ? colors.success : colors.border, backgroundColor: colors.surface, gap: 2 }}>
            <AppText variant="h2">{`${p}: ${d.allowed ? t('adDebug.allowed') : t('adDebug.blocked')}`}</AppText>
            {d.reasons.map((r) => (
              <AppText key={r} variant="body" style={{ color: colors.textMuted }}>{`• ${r}`}</AppText>
            ))}
          </View>
        );
      })}
      <AppText variant="h2" accessibilityRole="header">{t('adDebug.counters')}</AppText>
      {rows.map(([k, v]) => (
        <AppText key={k} variant="body">{`${k}: ${v}`}</AppText>
      ))}
      <BigButton variant="secondary" label={t('adDebug.back')} onPress={() => router.back()} />
    </Screen>
  );
}
