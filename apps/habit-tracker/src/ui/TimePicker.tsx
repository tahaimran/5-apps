import { useEffect, useRef, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Clock from 'lucide-react-native/icons/clock';
import { t } from '@shared/i18n';
import { useHaptics, useTheme } from '@shared/theme';
import { Button, PressableScale } from '@shared/ui';
import { fromHHMM, toHHMM } from '@/domain/timeFormat';
import { useSettings } from '@/store/settings';
import { useTimeFormat } from '@/store/timeFormat';

const ITEM = 48;
const VISIBLE = 5;
const MINUTE_STEP = 5;
const pad = (n: number) => String(n).padStart(2, '0');

interface WheelProps {
  items: string[];
  index: number;
  onChange: (index: number) => void;
  label: string;
  width: number;
}

/**
 * One snapping column. A tick of haptics as each value passes the center line (no React render
 * per frame), and the value commits when the scroll settles. TalkBack users get increment/decrement.
 */
function Wheel({ items, index, onChange, label, width }: WheelProps) {
  const { colors, type, fonts } = useTheme();
  const haptics = useHaptics();
  const hapticsOn = useSettings((s) => s.settings.haptics);
  const ref = useRef<ScrollView>(null);
  const passing = useRef(index);

  useEffect(() => {
    ref.current?.scrollTo({ y: index * ITEM, animated: false });
    passing.current = index;
    // Only on mount and when the item list changes (12h ↔ 24h); later moves come from the user.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items.length]);

  const at = (e: NativeSyntheticEvent<NativeScrollEvent>) =>
    Math.max(0, Math.min(items.length - 1, Math.round(e.nativeEvent.contentOffset.y / ITEM)));

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const i = at(e);
    if (i !== passing.current) {
      passing.current = i;
      if (hapticsOn) haptics.select();
    }
  };
  const settle = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const i = at(e);
    if (i !== index) onChange(i);
  };
  const step = (delta: 1 | -1) => {
    const i = Math.max(0, Math.min(items.length - 1, index + delta));
    ref.current?.scrollTo({ y: i * ITEM, animated: true });
    onChange(i);
  };

  return (
    <View
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel={label}
      accessibilityValue={{ text: items[index] }}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      onAccessibilityAction={(e) => step(e.nativeEvent.actionName === 'increment' ? 1 : -1)}
      style={{ width, height: ITEM * VISIBLE }}
    >
      <ScrollView
        ref={ref}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM}
        decelerationRate="fast"
        nestedScrollEnabled
        scrollEventThrottle={16}
        onScroll={onScroll}
        onMomentumScrollEnd={settle}
        contentContainerStyle={{ paddingVertical: ITEM * Math.floor(VISIBLE / 2) }}
      >
        {items.map((item, i) => (
          <View key={item} style={styles.item}>
            <Text
              style={[
                type.title,
                { fontFamily: fonts.display, color: i === index ? colors.text : colors.textMuted, fontWeight: i === index ? '800' : '600', opacity: i === index ? 1 : 0.55 },
              ]}
            >
              {item}
            </Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

export interface TimeFieldProps {
  /** "HH:mm", 24-hour, as stored. */
  value: string;
  onChange: (hhmm: string) => void;
  label: string;
}

/** A time shown in the user's clock style; tapping it opens wheels for hour, minute (and AM/PM). */
export function TimeField({ value, onChange, label }: TimeFieldProps) {
  const { colors, spacing, radius, type, touchTarget, fonts } = useTheme();
  const insets = useSafeAreaInsets();
  const clock = useTimeFormat();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(() => fromHHMM(value));

  const twelve = clock.format === '12h';
  const hours = twelve ? Array.from({ length: 12 }, (_, i) => String(i === 0 ? 12 : i)) : Array.from({ length: 24 }, (_, i) => pad(i));
  const minutes = Array.from({ length: 60 / MINUTE_STEP }, (_, i) => pad(i * MINUTE_STEP));
  const pm = draft.hour >= 12;
  const hourIndex = twelve ? draft.hour % 12 : draft.hour;
  const minuteIndex = Math.min(minutes.length - 1, Math.round(draft.minute / MINUTE_STEP));

  const show = () => {
    setDraft(fromHHMM(value));
    setOpen(true);
  };
  const save = () => {
    onChange(toHHMM(draft.hour, minuteIndex * MINUTE_STEP));
    setOpen(false);
  };

  return (
    <>
      <PressableScale
        accessibilityRole="button"
        accessibilityLabel={`${label}, ${clock.time(value)}`}
        accessibilityHint={t('time.hint')}
        onPress={show}
        scaleTo={0.96}
        style={[styles.field, { backgroundColor: colors.surfaceAlt, borderRadius: radius.pill, minHeight: touchTarget, paddingHorizontal: spacing.lg, gap: spacing.sm }]}
      >
        <Clock size={18} color={colors.primary} strokeWidth={2.25} />
        <Text style={[type.bodyLarge, { color: colors.text, fontWeight: '700' }]}>{clock.time(value)}</Text>
      </PressableScale>

      <Modal visible={open} transparent animationType="slide" statusBarTranslucent navigationBarTranslucent onRequestClose={() => setOpen(false)}>
        <Pressable accessibilityLabel={t('common.close')} style={styles.scrim} onPress={() => setOpen(false)} />
        <View
          style={[
            styles.sheet,
            { backgroundColor: colors.surface, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, padding: spacing.xl, paddingBottom: spacing.xl + insets.bottom, gap: spacing.lg },
          ]}
        >
          <View style={[styles.grabber, { backgroundColor: colors.border }]} />
          <Text accessibilityRole="header" style={[type.title, { color: colors.text, fontWeight: '800' }]}>
            {label}
          </Text>
          <Text style={[styles.preview, { color: colors.primary, fontFamily: fonts.display }]}>
            {clock.time(toHHMM(draft.hour, minuteIndex * MINUTE_STEP))}
          </Text>

          <View style={styles.wheels}>
            {/* The band marks the selected row across all columns. */}
            <View pointerEvents="none" style={[styles.band, { backgroundColor: colors.primarySoft, borderRadius: radius.md, top: ITEM * Math.floor(VISIBLE / 2) }]} />
            <Wheel
              items={hours}
              index={hourIndex}
              width={72}
              label={t('time.hour')}
              onChange={(i) => setDraft((d) => ({ ...d, hour: twelve ? (i % 12) + (pm ? 12 : 0) : i }))}
            />
            <Text style={[type.title, { color: colors.textMuted, fontWeight: '800' }]}>:</Text>
            <Wheel items={minutes} index={minuteIndex} width={72} label={t('time.minute')} onChange={(i) => setDraft((d) => ({ ...d, minute: i * MINUTE_STEP }))} />
            {twelve && (
              <Wheel
                items={[clock.periods.am, clock.periods.pm]}
                index={pm ? 1 : 0}
                width={72}
                label={t('time.period')}
                onChange={(i) => setDraft((d) => ({ ...d, hour: (d.hour % 12) + (i === 1 ? 12 : 0) }))}
              />
            )}
          </View>

          <Button label={t('common.done')} onPress={save} />
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  field: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start' },
  scrim: { flex: 1, backgroundColor: '#0000007A' },
  sheet: {},
  grabber: { alignSelf: 'center', width: 40, height: 5, borderRadius: 3, marginTop: -8 },
  preview: { fontSize: 40, lineHeight: 46, fontWeight: '800' },
  wheels: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  band: { position: 'absolute', left: 0, right: 0, height: ITEM },
  item: { height: ITEM, alignItems: 'center', justifyContent: 'center' },
});
