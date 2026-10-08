import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { t } from '@shared/i18n';
import { useTheme } from '@shared/theme';
import { Plant } from '@/components/Plant';
import { moodFor, nextStage } from '@/domain/plant';
import { activeId, catalog, isUnlocked, type ShopKind } from '@/domain/rewards';
import { liveProgress } from '@/domain/streak';
import { percentOf } from '@/domain/units';
import type { ShopItem } from '@/data/shop';
import { equip, earnFreeze, freezeStatus, unlockWithAd, unlocksLeft, type RewardResult } from '@/features/garden/rewards';
import { useFeedback } from '@/store/feedback';
import { useSettings } from '@/store/settings';
import { useToday } from '@/store/today';
import { useWater } from '@/store/water';
import { Screen } from '@/ui/Screen';
import { PrimaryButton } from '@/ui/controls';

const MESSAGES: Record<RewardResult, string | null> = {
  earned: null,
  cancelled: null,
  unavailable: 'garden.adUnavailable',
  full: 'garden.freezeFull',
  today: 'garden.freezeToday',
  limit: 'garden.unlockLimit',
};

export default function Garden() {
  const { colors, spacing, radius, type, touchTarget } = useTheme();
  const feedback = useFeedback();
  const today = useToday((s) => s.today);
  const summary = useWater((s) => s.summaries[today]);
  const progressRaw = useWater((s) => s.progress);
  const goalMl = useSettings((s) => s.goal.goalMl);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const live = liveProgress(progressRaw, summary?.reached ?? false);
  const percent = percentOf(summary?.effectiveMl ?? 0, goalMl);
  const next = nextStage(live.goalDays);
  const block = freezeStatus();

  const run = async (action: () => Promise<RewardResult>) => {
    setBusy(true);
    setMessage(null);
    try {
      const result = await action();
      const key = MESSAGES[result];
      setMessage(key ? t(key) : result === 'earned' ? t('garden.earned') : null);
      if (result === 'earned') feedback.success();
    } finally {
      setBusy(false);
    }
  };

  const shopCard = (kind: ShopKind, item: ShopItem) => {
    const unlocked = isUnlocked(kind, item, live);
    const active = activeId(kind, progressRaw) === item.id;
    const name = t(`garden.${kind === 'skin' ? 'skins' : 'cups'}.${item.id}`);
    const detail = unlocked
      ? t(active ? 'garden.using' : 'garden.use')
      : item.unlock.kind === 'streak'
        ? t('garden.reachStreak', { days: item.unlock.days })
        : t('garden.watchToUnlock');
    const disabled = busy || (!unlocked && item.unlock.kind === 'streak');
    const press = () => {
      if (unlocked) equip(kind, item.id);
      else if (item.unlock.kind === 'ad') void run(() => unlockWithAd(kind, item.id));
    };
    return (
      <Pressable
        key={`${kind}-${item.id}`}
        accessibilityRole="button"
        accessibilityLabel={`${name}, ${detail}`}
        accessibilityState={{ selected: active, disabled }}
        disabled={disabled && !unlocked}
        onPress={press}
        style={[
          styles.card,
          {
            minHeight: 88,
            borderRadius: radius.md,
            borderColor: active ? colors.primary : colors.border,
            borderWidth: active ? 2 : 1,
            backgroundColor: colors.surface,
            padding: spacing.md,
            opacity: unlocked ? 1 : 0.85,
          },
        ]}
      >
        <View style={[styles.swatch, { backgroundColor: item.pot, borderRadius: 14 }]}>
          <MaterialCommunityIcons name={unlocked ? (kind === 'skin' ? 'flower-tulip' : 'cup-water') : 'lock-outline'} size={20} color="#FFFFFF" />
        </View>
        <Text style={[type.body, { color: colors.text, fontWeight: '700' }]} numberOfLines={1}>
          {name}
        </Text>
        <Text style={[type.caption, { color: active ? colors.primary : colors.textMuted, fontWeight: '600' }]} numberOfLines={2}>
          {detail}
        </Text>
      </Pressable>
    );
  };

  return (
    <Screen>
        <Text accessibilityRole="header" style={[type.headline, { color: colors.text, fontWeight: '800' }]}>
          {t('tabs.garden')}
        </Text>

        <View style={{ alignItems: 'center', gap: spacing.sm }}>
          <Plant stage={live.stage} mood={moodFor(percent)} skin={progressRaw.activeSkin} size={200} />
          <Text style={[type.title, { color: colors.text, fontWeight: '800' }]}>{t(`plant.stageNames.${live.stage}`)}</Text>
          <Text style={[type.body, { color: colors.textMuted, textAlign: 'center' }]}>
            {next ? t('garden.toNext', { have: next.have, need: next.need, name: t(`plant.stageNames.${next.stage}`) }) : t('garden.fullyGrown')}
          </Text>
          <Text style={[type.caption, { color: colors.textMuted }]}>{t('garden.goalDays', { count: live.goalDays })}</Text>
        </View>

        <View style={[styles.stats, { gap: spacing.sm }]}>
          {[
            [t('history.streak'), t('history.streakValue', { count: live.streak })],
            [t('history.bestStreak'), t('history.streakValue', { count: live.bestStreak })],
            [t('garden.freezes'), String(live.streakFreezes)],
          ].map(([label, value]) => (
            <View key={label} accessible accessibilityLabel={`${label}: ${value}`} style={[styles.stat, { backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md }]}>
              <Text style={[type.caption, { color: colors.textMuted, fontWeight: '600' }]}>{label}</Text>
              <Text style={[type.bodyLarge, { color: colors.text, fontWeight: '800' }]}>{value}</Text>
            </View>
          ))}
        </View>

        <View style={{ backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.lg, gap: spacing.sm }}>
          <Text accessibilityRole="header" style={[type.bodyLarge, { color: colors.text, fontWeight: '700' }]}>
            {t('garden.freezeTitle')}
          </Text>
          <Text style={[type.body, { color: colors.textMuted }]}>{t('garden.freezeBody')}</Text>
          <PrimaryButton label={t('garden.watchFreeze')} disabled={busy || block !== null} onPress={() => void run(earnFreeze)} />
          {block && <Text style={[type.caption, { color: colors.textMuted }]}>{t(MESSAGES[block] ?? '')}</Text>}
        </View>

        {message && (
          <Text accessibilityLiveRegion="polite" style={[type.body, { color: colors.text, fontWeight: '600', minHeight: touchTarget / 2 }]}>
            {message}
          </Text>
        )}

        <Text accessibilityRole="header" style={[type.bodyLarge, { color: colors.text, fontWeight: '700' }]}>
          {t('garden.skinsTitle')}
        </Text>
        <View style={styles.grid}>{catalog('skin').map((item) => shopCard('skin', item))}</View>
        <Text accessibilityRole="header" style={[type.bodyLarge, { color: colors.text, fontWeight: '700' }]}>
          {t('garden.cupsTitle')}
        </Text>
        <View style={styles.grid}>{catalog('cup').map((item) => shopCard('cup', item))}</View>
        <Text style={[type.caption, { color: colors.textMuted }]}>{t('garden.unlocksLeft', { count: unlocksLeft() })}</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  stats: { flexDirection: 'row' },
  stat: { flex: 1, gap: 2 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  card: { width: '48%', flexGrow: 1, gap: 4 },
  swatch: { width: 44, height: 28, alignItems: 'center', justifyContent: 'center' },
});
