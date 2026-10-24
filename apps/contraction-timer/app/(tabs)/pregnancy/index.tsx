import { useEffect, useState } from 'react';
import { FlatList, StyleSheet, View, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import CalendarHeart from 'lucide-react-native/icons/calendar-heart';
import ChevronRight from 'lucide-react-native/icons/chevron-right';
import ClipboardList from 'lucide-react-native/icons/clipboard-list';
import Luggage from 'lucide-react-native/icons/luggage';
import { NativeAdCard } from '@shared/ads';
import { t } from '@shared/i18n';
import { useTheme } from '@shared/theme';
import { Button, Card, IconButton, PressableScale } from '@shared/ui';
import { useAdScreen } from '@/ads/guard';
import { withAdSlots, type ListItem } from '@/domain/adSlots';
import { progressOf } from '@/domain/checklists';
import { currentCardWeek, FIRST_WEEK, orderedCards, weekCard, type WeekCard } from '@/domain/weeks';
import { PregnancyDial } from '@/features/pregnancy/PregnancyDial';
import { ReadyCarousel } from '@/features/pregnancy/ReadyCarousel';
import { SizeArt } from '@/features/pregnancy/SizeArt';
import { SizeExplorer } from '@/features/pregnancy/SizeExplorer';
import { WeekStrip } from '@/features/pregnancy/WeekStrip';
import { useChecklist } from '@/hooks/useChecklist';
import { usePregnancy } from '@/hooks/usePregnancy';
import { useSettings } from '@/store/settings';
import { useAppColors } from '@/theme/mode';
import { AppText } from '@/ui/AppText';
import { BannerSlot } from '@/ui/BannerSlot';
import { dayMonth } from '@/ui/format';
import { TabTitle } from '@/ui/Screen';
import { NavRow, SettingsGroup } from '@/ui/SettingsRow';

/** A section heading inside the list. */
function Section({ title }: { title: string }) {
  const { colors, spacing, type } = useTheme();
  return (
    <AppText accessibilityRole="header" style={[type.title, { color: colors.text, fontWeight: '800', marginTop: spacing.md }]}>
      {title}
    </AppText>
  );
}

/** A small rounded tag under the dial. */
function Chip({ text, tone }: { text: string; tone: 'mint' | 'peach' | 'lilac' }) {
  const { colors, radius, spacing, type } = useTheme();
  const app = useAppColors();
  const bg = tone === 'mint' ? colors.primarySoft : tone === 'peach' ? app.activeSoft : colors.surfaceAlt;
  const fg = tone === 'mint' ? colors.primary : tone === 'peach' ? app.activeText : colors.text;
  return (
    <View style={{ backgroundColor: bg, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: 6 }}>
      <AppText style={[type.body, { color: fg, fontWeight: '700' }]}>{text}</AppText>
    </View>
  );
}

/**
 * Plan §5.4, after the reference screens: a pregnancy dial (40 weeks around the face, filled to today),
 * a strip of weeks to page through, this week's picture card, "Getting ready" cards to swipe, and the
 * week-by-week list (this week pinned first, the native ad card after the 3rd, plan §12).
 */
export default function Pregnancy() {
  const { colors, spacing, radius, type, shadow } = useTheme();
  const app = useAppColors();
  const adsReady = useAdScreen('weeks');
  const units = useSettings((s) => s.settings.units);
  const { width } = useWindowDimensions();
  const { gestation, shown, edd } = usePregnancy();
  const bag = progressOf(useChecklist('hospitalBag'));
  const plan = progressOf(useChecklist('birthPlan'));
  const currentWeek = shown ? currentCardWeek(shown.weeks) : null;
  const cards = withAdSlots(orderedCards(shown?.weeks ?? null));
  const current = shown ? weekCard(currentCardWeek(shown.weeks)) : null;
  const dial = Math.min(280, width - 88);
  // The week shown by the strip and the size explorer: this week to begin with.
  const [selected, setSelected] = useState(currentWeek ?? FIRST_WEEK);
  useEffect(() => setSelected(currentWeek ?? FIRST_WEEK), [currentWeek]);

  const toGo = !gestation
    ? ''
    : gestation.daysToGo > 1
      ? t('pregnancy.toGo', { n: gestation.daysToGo })
      : gestation.daysToGo === 1
        ? t('pregnancy.toGoOne')
        : gestation.daysToGo === 0
          ? t('pregnancy.dueToday')
          : gestation.daysToGo === -1
            ? t('pregnancy.pastDaysOne')
            : t('pregnancy.pastDays', { n: -gestation.daysToGo });
  const trimester = gestation ? t(`pregnancy.trimesterName.${gestation.trimester}`) : t('pregnancy.allWeeks');

  const header = (
    <View style={{ gap: spacing.md, marginBottom: spacing.sm }}>
      <TabTitle
        title={t('pregnancy.title')}
        accessory={<IconButton icon={CalendarHeart} variant="tonal" label={t(gestation ? 'pregnancy.dueRowEdit' : 'pregnancy.dueRow')} onPress={() => router.push('/pregnancy/due-date')} />}
      />

      {gestation && shown ? (
        <Card style={{ alignItems: 'center', gap: spacing.md, paddingVertical: spacing.xl }}>
          <View accessible accessibilityLabel={t('pregnancy.headerLabel', { weeks: shown.weeks, days: shown.day, toGo, size: current ? t('pregnancy.sizeLine', { size: current.size }) : '' })} style={styles.center}>
            <PregnancyDial weeks={shown.weeks} day={shown.day} size={dial} top={t('pregnancy.dialWeek')} bottom={t(shown.day === 1 ? 'pregnancy.dialDay' : 'pregnancy.dialDays', { n: shown.day })} />
            <AppText style={[type.title, { color: colors.text, fontWeight: '800', marginTop: spacing.md, textAlign: 'center' }]}>{t('pregnancy.header', { weeks: shown.weeks, days: shown.day })}</AppText>
          </View>
          <View style={[styles.chips, { gap: spacing.sm }]}>
            <Chip tone="mint" text={toGo} />
            <Chip tone="lilac" text={t('due.trimester', { n: gestation.trimester })} />
            {edd ? <Chip tone="peach" text={t('pregnancy.dueChip', { date: dayMonth(edd) })} /> : null}
          </View>
          {gestation.pastDue ? <AppText style={[type.body, { color: colors.textMuted, textAlign: 'center' }]}>{t('pregnancy.pastDue')}</AppText> : null}
        </Card>
      ) : (
        <Card style={{ alignItems: 'center', gap: spacing.md, paddingVertical: spacing.xl }}>
          <PregnancyDial weeks={null} day={0} size={Math.min(220, dial)} top={t('pregnancy.dialWeek')} bottom={t('pregnancy.dialUnknown')} />
          <AppText style={[type.title, { color: colors.text, fontWeight: '800', textAlign: 'center' }]}>{t('pregnancy.noDue')}</AppText>
          <AppText style={[type.bodyLarge, { color: colors.textMuted, textAlign: 'center' }]}>{t('pregnancy.noDueBody')}</AppText>
          <Button icon={CalendarHeart} label={t('pregnancy.addDue')} onPress={() => router.push('/pregnancy/due-date')} />
        </Card>
      )}

      {shown && [34, 36, 37].includes(shown.weeks) && bag.percent < 100 ? (
        <SettingsGroup>
          <NavRow icon={Luggage} label={t('pregnancy.bagNudge', { percent: bag.percent })} detail={t('pregnancy.bagNudgeBody')} tint={app.alertIcon} bg={app.alertBg} onPress={() => router.push('/pregnancy/hospital-bag')} />
        </SettingsGroup>
      ) : null}

      <WeekStrip current={currentWeek} selected={selected} onSelect={setSelected} title={trimester} subtitle={shown ? t('pregnancy.stripSubtitle', { n: shown.weeks }) : undefined} />

      <SizeExplorer selected={selected} current={currentWeek} units={units} onSelect={setSelected} />

      <Section title={t('pregnancy.readyTitle')} />
      <ReadyCarousel
        items={[
          { key: 'bag', icon: Luggage, title: t('pregnancy.bagRow'), detail: t('pregnancy.bagProgress', { percent: bag.percent }), progress: bag.percent / 100, tint: app.activeText, bg: app.activeSoft, onPress: () => router.push('/pregnancy/hospital-bag') },
          {
            key: 'plan',
            icon: ClipboardList,
            title: t('pregnancy.planRow'),
            detail: t('pregnancy.planProgress', { checked: plan.checked, total: plan.total }),
            progress: plan.total > 0 ? plan.checked / plan.total : 0,
            tint: colors.accent,
            bg: colors.surfaceAlt,
            onPress: () => router.push('/pregnancy/birth-plan'),
          },
          {
            key: 'due',
            icon: CalendarHeart,
            title: t(gestation ? 'pregnancy.dueRowEdit' : 'pregnancy.dueRow'),
            detail: edd ? t('pregnancy.dueChip', { date: dayMonth(edd) }) : t('pregnancy.dueNotSet'),
            progress: null,
            tint: colors.primary,
            bg: colors.primarySoft,
            onPress: () => router.push('/pregnancy/due-date'),
          },
        ]}
      />

      <Section title={t('pregnancy.weeksTitle')} />
    </View>
  );

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: colors.background }]} edges={['top']}>
      <FlatList<ListItem<WeekCard>>
        style={styles.clip}
        data={cards}
        extraData={adsReady}
        keyExtractor={(c) => (c.kind === 'ad' ? c.key : String(c.card.week))}
        ListHeaderComponent={header}
        contentContainerStyle={{ padding: spacing.xl - 4, gap: spacing.sm }}
        renderItem={({ item: entry }) => {
          // The native card is labelled "Ad" by the shared layer, and falls back to nothing (or a house card) when there is no fill.
          if (entry.kind === 'ad') return adsReady ? <NativeAdCard placement="week_native" /> : null;
          const item = entry.card;
          const isCurrent = item.week === currentWeek;
          return (
            <PressableScale
              accessibilityRole="button"
              accessibilityLabel={t(isCurrent ? 'pregnancy.weekRowCurrentLabel' : 'pregnancy.weekRowLabel', { n: item.week, size: item.size })}
              onPress={() => router.push({ pathname: '/pregnancy/week/[n]', params: { n: String(item.week) } })}
              scaleTo={0.98}
              style={[
                styles.row,
                { minHeight: 64, gap: spacing.md, padding: spacing.md, borderRadius: radius.lg, borderWidth: 2, borderColor: isCurrent ? colors.primary : colors.surface, backgroundColor: colors.surface },
                shadow(isCurrent ? 2 : 0),
              ]}
            >
              <View style={[styles.thumb, { backgroundColor: isCurrent ? colors.primarySoft : colors.surfaceAlt }]}>
                <SizeArt size={item.size} px={44} />
              </View>
              <View style={styles.flex}>
                <AppText style={[type.bodyLarge, { color: colors.text, fontWeight: '700' }]}>{t(isCurrent ? 'pregnancy.weekRowCurrent' : 'pregnancy.weekRow', { n: item.week })}</AppText>
                <AppText style={[type.body, { color: colors.textMuted }]}>{t('pregnancy.weekRowSize', { size: item.size })}</AppText>
              </View>
              <ChevronRight size={20} color={colors.textMuted} strokeWidth={2.25} />
            </PressableScale>
          );
        }}
      />
      <BannerSlot placement="week_banner" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  clip: { flex: 1, overflow: 'hidden' },
  center: { alignItems: 'center' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' },
  row: { flexDirection: 'row', alignItems: 'center' },
  thumb: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
});
