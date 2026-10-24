import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { cubicBezier, useReducedMotion } from 'react-native-reanimated';
import CircleCheck from 'lucide-react-native/icons/circle-check';
import Flame from 'lucide-react-native/icons/flame';
import Flower2 from 'lucide-react-native/icons/flower-2';
import GlassWater from 'lucide-react-native/icons/glass-water';
import Lock from 'lucide-react-native/icons/lock';
import Play from 'lucide-react-native/icons/play';
import Snowflake from 'lucide-react-native/icons/snowflake';
import Sparkles from 'lucide-react-native/icons/sparkles';
import Trophy from 'lucide-react-native/icons/trophy';
import { t } from '@shared/i18n';
import { useTheme } from '@shared/theme';
import { Card, PressableScale, showToast } from '@shared/ui';
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
import { extraColorsFor } from '@/theme/tokens';
import { IconCircle, StatTile } from '@/ui/SettingsRow';
import { Screen } from '@/ui/Screen';
import { PrimaryButton } from '@/ui/controls';

const CSS_EASE_OUT = cubicBezier(0.23, 1, 0.32, 1);

const MESSAGES: Record<RewardResult, string | null> = {
  earned: null,
  cancelled: null,
  unavailable: 'garden.adUnavailable',
  full: 'garden.freezeFull',
  today: 'garden.freezeToday',
  limit: 'garden.unlockLimit',
};

export default function Garden() {
  const { colors, spacing, radius, type, mode, fonts } = useTheme();
  const reduced = useReducedMotion();
  const feedback = useFeedback();
  const today = useToday((s) => s.today);
  const summary = useWater((s) => s.summaries[today]);
  const progressRaw = useWater((s) => s.progress);
  const goalMl = useSettings((s) => s.goal.goalMl);
  const [busy, setBusy] = useState(false);
  const extra = extraColorsFor(mode);

  const live = liveProgress(progressRaw, summary?.reached ?? false);
  const percent = percentOf(summary?.effectiveMl ?? 0, goalMl);
  const next = nextStage(live.goalDays);
  const block = freezeStatus();

  const run = async (action: () => Promise<RewardResult>) => {
    setBusy(true);
    try {
      const result = await action();
      const key = MESSAGES[result];
      if (result === 'earned') {
        feedback.celebrate();
        showToast({ message: t('garden.earned'), icon: Sparkles, tone: 'success' });
      } else if (key) {
        showToast({ message: t(key), tone: 'warning' });
      }
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
      if (unlocked) {
        feedback.tap();
        equip(kind, item.id);
      } else if (item.unlock.kind === 'ad') void run(() => unlockWithAd(kind, item.id));
    };
    const Icon = unlocked ? (kind === 'skin' ? Flower2 : GlassWater) : Lock;
    return (
      <PressableScale
        key={`${kind}-${item.id}`}
        accessibilityRole="button"
        accessibilityLabel={`${name}, ${detail}`}
        accessibilityState={{ selected: active, disabled }}
        disabled={disabled && !unlocked}
        onPress={press}
        scaleTo={0.96}
        style={[
          styles.card,
          {
            minHeight: 112,
            borderRadius: radius.lg,
            borderColor: active ? colors.primary : colors.border,
            borderWidth: active ? 2 : 1,
            backgroundColor: active ? colors.primarySoft : colors.surface,
            padding: spacing.md,
          },
        ]}
      >
        <View style={styles.cardHead}>
          <View style={[styles.swatch, { backgroundColor: item.pot, opacity: unlocked ? 1 : 0.55 }]}>
            <Icon size={18} color="#FFFFFF" strokeWidth={2.25} />
          </View>
          {active && <CircleCheck size={20} color={colors.primary} strokeWidth={2.25} />}
        </View>
        <Text style={[type.body, { color: colors.text, fontWeight: '700' }]} numberOfLines={1}>
          {name}
        </Text>
        <Text style={[type.caption, { color: active ? colors.primary : colors.textMuted, fontWeight: '600' }]} numberOfLines={2}>
          {detail}
        </Text>
      </PressableScale>
    );
  };

  const toNext = next ? next.have / Math.max(1, next.need) : 1;

  return (
    <Screen>
      <Text accessibilityRole="header" style={[type.headline, { color: colors.text, fontWeight: '800' }]}>
        {t('tabs.garden')}
      </Text>

      <View style={[styles.hero, { borderRadius: radius.xl }]}>
        <LinearGradient colors={extra.garden} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
        <View style={{ alignItems: 'center', gap: spacing.sm, padding: spacing.xl }}>
          <Plant stage={live.stage} mood={moodFor(percent)} skin={progressRaw.activeSkin} size={200} />
          <Text style={[type.headline, { color: colors.text, fontWeight: '800' }]}>{t(`plant.stageNames.${live.stage}`)}</Text>
          <Text style={[type.body, { color: colors.textMuted, textAlign: 'center' }]}>
            {next ? t('garden.toNext', { have: next.have, need: next.need, name: t(`plant.stageNames.${next.stage}`) }) : t('garden.fullyGrown')}
          </Text>
          {/* Progress to the next stage: an absolute, childless fill, so its width can transition. */}
          <View
            accessible
            accessibilityRole="progressbar"
            accessibilityLabel={t('garden.goalDays', { count: live.goalDays })}
            accessibilityValue={{ min: 0, max: 100, now: Math.round(toNext * 100) }}
            style={[styles.bar, { backgroundColor: colors.surface, borderRadius: radius.pill }]}
          >
            <Animated.View
              style={[
                styles.fill,
                {
                  width: `${Math.round(toNext * 100)}%`,
                  backgroundColor: colors.success,
                  borderRadius: radius.pill,
                  transitionProperty: 'width',
                  transitionDuration: reduced ? 0 : 280,
                  transitionTimingFunction: CSS_EASE_OUT,
                },
              ]}
            />
          </View>
          <Text style={[type.caption, { color: colors.textMuted, fontWeight: '600' }]}>{t('garden.goalDays', { count: live.goalDays })}</Text>
        </View>
      </View>

      <View style={[styles.row, { gap: spacing.sm }]}>
        <StatTile icon={Flame} tint={colors.accent} bg={extra.sunSoft} label={t('history.streak')} value={t('history.streakValue', { count: live.streak })} />
        <StatTile icon={Trophy} tint={colors.accent} bg={extra.sunSoft} label={t('history.bestStreak')} value={t('history.streakValue', { count: live.bestStreak })} />
        <StatTile icon={Snowflake} label={t('garden.freezes')} value={String(live.streakFreezes)} />
      </View>

      <Card style={{ gap: spacing.md }}>
        <View style={[styles.row, { gap: spacing.md, alignItems: 'flex-start' }]}>
          <IconCircle icon={Snowflake} size={44} />
          <View style={styles.flex}>
            <Text accessibilityRole="header" style={[type.bodyLarge, { color: colors.text, fontWeight: '700' }]}>
              {t('garden.freezeTitle')}
            </Text>
            <Text style={[type.body, { color: colors.textMuted }]}>{t('garden.freezeBody')}</Text>
          </View>
        </View>
        <PrimaryButton label={t('garden.watchFreeze')} icon={Play} disabled={busy || block !== null} onPress={() => void run(earnFreeze)} />
        {block && <Text style={[type.caption, { color: colors.textMuted, textAlign: 'center' }]}>{t(MESSAGES[block] ?? '')}</Text>}
      </Card>

      <Text accessibilityRole="header" style={[type.title, { color: colors.text, fontWeight: '800', fontFamily: fonts.display }]}>
        {t('garden.skinsTitle')}
      </Text>
      <View style={styles.grid}>{catalog('skin').map((item) => shopCard('skin', item))}</View>
      <Text accessibilityRole="header" style={[type.title, { color: colors.text, fontWeight: '800', fontFamily: fonts.display }]}>
        {t('garden.cupsTitle')}
      </Text>
      <View style={styles.grid}>{catalog('cup').map((item) => shopCard('cup', item))}</View>
      <Text style={[type.caption, { color: colors.textMuted }]}>{t('garden.unlocksLeft', { count: unlocksLeft() })}</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  row: { flexDirection: 'row' },
  hero: { overflow: 'hidden' },
  bar: { alignSelf: 'stretch', height: 10, marginTop: 4, overflow: 'hidden' },
  fill: { position: 'absolute', left: 0, top: 0, bottom: 0 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  card: { width: '47%', flexGrow: 1, gap: 6 },
  cardHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  swatch: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
});
