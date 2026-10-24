import { useEffect, useRef, useState } from 'react';
import { FlatList, StyleSheet, View, useWindowDimensions, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useReducedMotion } from 'react-native-reanimated';
import ArrowUpRight from 'lucide-react-native/icons/arrow-up-right';
import { t } from '@shared/i18n';
import { playSound } from '@shared/sound';
import { haptics, useTheme } from '@shared/theme';
import { PressableScale } from '@shared/ui';
import { FIRST_WEEK, lengthText, WEEK_CARDS, weightText, type Units, type WeekCard } from '@/domain/weeks';
import { useAppColors, useStrongFill } from '@/theme/mode';
import { AppText } from '@/ui/AppText';
import { CSS_EASE_OUT, KICK_POP, POP_MS } from '@/ui/motion';
import { SizeArt } from './SizeArt';

const GAP = 12;
/** The drawing grows with the week: about 64dp for the first card, 150dp at the end of pregnancy. */
export const artSize = (week: number) => Math.round(64 + ((Math.min(40, Math.max(FIRST_WEEK, week)) - FIRST_WEEK) / (40 - FIRST_WEEK)) * 86);

/** One week's page: the drawing (tap it for a little bounce), what it is, length and weight, and the way to the full card. */
function Page({ card, width, current, units }: { card: WeekCard; width: number; current: boolean; units: Units }) {
  const { spacing, radius, type, shadow } = useTheme();
  const app = useAppColors();
  const strong = useStrongFill();
  const reduced = useReducedMotion();
  const [pops, setPops] = useState(0);
  const length = lengthText(card.lengthCm, units);
  const weight = weightText(card.weightG, units, t('week.under1g'));
  const art = artSize(card.week);
  const bounce = () => {
    setPops((n) => n + 1);
    void haptics.select();
    playSound('tap');
  };
  return (
    <View style={[{ width, borderRadius: radius.xl }, shadow(2)]}>
      <View style={[styles.card, { borderRadius: radius.xl, padding: spacing.xl - 4, gap: spacing.md }]}>
        <LinearGradient colors={app.hero} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
        <View style={[styles.tag, { backgroundColor: app.heroTrack, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: 4 }]}>
          <AppText style={[type.caption, { color: app.onHero, fontWeight: '700' }]}>{t(current ? 'pregnancy.thisWeek' : 'pregnancy.weekTag', { n: card.week })}</AppText>
        </View>
        {/* The stage: a soft disc the drawing sits on; it grows a little every week. */}
        <PressableScale
          accessibilityRole="button"
          accessibilityLabel={t('pregnancy.artLabel', { size: card.size })}
          accessibilityHint={t('pregnancy.artHint')}
          onPress={bounce}
          scaleTo={0.95}
          style={styles.stage}
        >
          <View style={[styles.disc, { width: 168, height: 168, borderRadius: 84, backgroundColor: app.heroTrack }]}>
            <Animated.View style={reduced || pops === 0 ? null : { animationName: KICK_POP[pops % 2], animationDuration: POP_MS, animationTimingFunction: CSS_EASE_OUT }}>
              <SizeArt size={card.size} px={art} />
            </Animated.View>
          </View>
        </PressableScale>
        <AppText style={[type.title, { color: app.onHero, fontWeight: '800', textAlign: 'center' }]}>{t('week.sizeIs', { size: card.size })}</AppText>
        <View style={[styles.bottom, { gap: spacing.sm }]}>
          <View style={[styles.chips, { gap: spacing.sm }]}>
            {[t('pregnancy.chipLength', { length }), t('pregnancy.chipWeight', { weight })].map((chip) => (
              <View key={chip} style={{ backgroundColor: app.heroTrack, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: 6 }}>
                <AppText style={[type.body, { color: app.onHero, fontWeight: '600' }]}>{chip}</AppText>
              </View>
            ))}
          </View>
          <PressableScale
            accessibilityRole="button"
            accessibilityLabel={t('pregnancy.openWeek', { n: card.week })}
            onPress={() => router.push({ pathname: '/pregnancy/week/[n]', params: { n: String(card.week) } })}
            scaleTo={0.9}
            style={[styles.arrow, { backgroundColor: strong.bg }]}
          >
            <ArrowUpRight size={24} color={strong.fg} strokeWidth={2.5} />
          </PressableScale>
        </View>
      </View>
    </View>
  );
}

/**
 * The size explorer (the reference's big picture card, made interactive): every week from 4 to 42 as a
 * page to swipe through, the drawing growing as the weeks go on, a tap on it for a bounce, and the arrow
 * to the full card. It follows `selected` (the week strip) and reports where a swipe settles.
 */
export function SizeExplorer({ selected, current, units, onSelect }: { selected: number; current: number | null; units: Units; onSelect: (week: number) => void }) {
  const { width } = useWindowDimensions();
  // A little of the next week peeks in at the edge, so it reads as something to swipe.
  const page = width - 64;
  const list = useRef<FlatList<WeekCard>>(null);
  const index = Math.max(0, WEEK_CARDS.findIndex((c) => c.week === selected));
  const shown = useRef(index);
  useEffect(() => {
    if (index !== shown.current) {
      shown.current = index;
      list.current?.scrollToIndex({ index, animated: true });
    }
  }, [index]);
  const settle = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const i = Math.max(0, Math.min(WEEK_CARDS.length - 1, Math.round(e.nativeEvent.contentOffset.x / (page + GAP))));
    shown.current = i;
    if (WEEK_CARDS[i].week !== selected) onSelect(WEEK_CARDS[i].week);
  };
  return (
    <FlatList
      ref={list}
      horizontal
      data={WEEK_CARDS}
      keyExtractor={(c) => String(c.week)}
      initialScrollIndex={index}
      getItemLayout={(_, i) => ({ length: page + GAP, offset: (page + GAP) * i, index: i })}
      snapToInterval={page + GAP}
      decelerationRate="fast"
      showsHorizontalScrollIndicator={false}
      onMomentumScrollEnd={settle}
      style={styles.bleed}
      contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 8 }}
      ItemSeparatorComponent={() => <View style={{ width: GAP }} />}
      renderItem={({ item }) => <Page card={item} width={page} current={item.week === current} units={units} />}
    />
  );
}

const styles = StyleSheet.create({
  // Runs to the screen edges (the list's 20dp gutter is undone) so the next week peeks in.
  bleed: { marginHorizontal: -20 },
  card: { overflow: 'hidden' },
  tag: { alignSelf: 'flex-start' },
  stage: { alignSelf: 'center' },
  disc: { alignItems: 'center', justifyContent: 'center' },
  bottom: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', flex: 1 },
  arrow: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
});
