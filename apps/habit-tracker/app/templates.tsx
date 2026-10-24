import { useMemo, useState } from 'react';
import { Modal, Pressable, SectionList, StyleSheet, Text, View } from 'react-native';
import { Stack, router } from 'expo-router';
import ChevronRight from 'lucide-react-native/icons/chevron-right';
import CircleCheck from 'lucide-react-native/icons/circle-check';
import { SafeAreaView } from 'react-native-safe-area-context';
import { t } from '@shared/i18n';
import { useTheme } from '@shared/theme';
import { PressableScale, showToast } from '@shared/ui';
import { templates, type Template } from '@/data/templates';
import { categories } from '@/domain/categories';
import { draftFromTemplate } from '@/features/habit-editor/drafts';
import { useHabits } from '@/store/habits';
import { useToday } from '@/store/today';
import { PrimaryButton, TextButton, TextField } from '@/ui/controls';
import { scheduleLabel } from '@/ui/format';
import { habitColors } from '@/theme/tokens';
import { readableOn } from '@/theme/contrast';
import { HabitIcon } from '@/ui/icons';
import { useTimeFormat } from '@shared/time';

const targetLabel = (tpl: Template) =>
  tpl.type === 'count'
    ? t('templatesScreen.target_count', { target: tpl.target, unit: t(`templates.${tpl.id}.unit`) })
    : tpl.type === 'timer'
      ? t('templatesScreen.target_timer', { target: tpl.target })
      : t('templatesScreen.target_boolean');

const summary = (tpl: Template) => `${targetLabel(tpl)} · ${scheduleLabel(tpl.schedule)}`;

export default function Templates() {
  const { colors, spacing, radius, type, touchTarget, shadow } = useTheme();
  const today = useToday((s) => s.today);
  const addHabit = useHabits((s) => s.addHabit);
  const [query, setQuery] = useState('');
  const [preview, setPreview] = useState<Template | null>(null);
  const clock = useTimeFormat();

  const sections = useMemo(() => {
    const q = query.trim().toLowerCase();
    return categories
      .map((c) => ({
        id: c.id,
        title: t(`categories.${c.id}`),
        data: templates.filter(
          (tpl) => tpl.category === c.id && (q === '' || t(`templates.${tpl.id}.name`).toLowerCase().includes(q)),
        ),
      }))
      .filter((s) => s.data.length > 0);
  }, [query]);

  const add = (tpl: Template) => {
    addHabit(draftFromTemplate(tpl, today));
    setPreview(null);
    // Back to Today; if we came through "New habit" this also closes that modal.
    router.dismissAll();
    showToast({ message: t('editor.added', { name: t(`templates.${tpl.id}.name`) }), icon: CircleCheck, tone: 'success' });
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['bottom']}>
      <Stack.Screen options={{ title: t('templatesScreen.title'), headerShown: true }} />
      <View style={{ padding: spacing.lg, paddingBottom: spacing.sm }}>
        <TextField value={query} onChangeText={setQuery} label={t('templatesScreen.searchLabel')} placeholder={t('templatesScreen.search')} />
      </View>

      <SectionList
        sections={sections}
        keyExtractor={(tpl) => tpl.id}
        contentContainerStyle={{ padding: spacing.lg, paddingTop: 0 }}
        stickySectionHeadersEnabled={false}
        ListEmptyComponent={
          <Text style={[type.body, { color: colors.textMuted }]}>{t('templatesScreen.empty', { query })}</Text>
        }
        renderSectionHeader={({ section }) => (
          <Text accessibilityRole="header" style={[type.title, { color: colors.text, fontWeight: '700', marginTop: spacing.lg, marginBottom: spacing.xs }]}>
            {section.title}
          </Text>
        )}
        renderItem={({ item }) => (
          <PressableScale
            accessibilityRole="button"
            accessibilityLabel={`${t(`templates.${item.id}.name`)}. ${summary(item)}`}
            onPress={() => setPreview(item)}
            scaleTo={0.98}
            style={[styles.card, { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md, minHeight: touchTarget + 20, marginBottom: spacing.sm }, shadow(1)]}
          >
            <View style={[styles.tile, { backgroundColor: habitColors[item.color] + '1F', borderRadius: radius.md }]}>
              <HabitIcon name={item.icon} size={22} color={habitColors[item.color]} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[type.bodyLarge, { color: colors.text, fontWeight: '600' }]}>{t(`templates.${item.id}.name`)}</Text>
              <Text style={[type.caption, { color: colors.textMuted }]}>{summary(item)}</Text>
            </View>
            <ChevronRight size={20} color={colors.textMuted} />
          </PressableScale>
        )}
      />

      <Modal visible={preview !== null} transparent animationType="slide" statusBarTranslucent navigationBarTranslucent onRequestClose={() => setPreview(null)}>
        <Pressable accessibilityLabel={t('common.close')} style={styles.scrim} onPress={() => setPreview(null)} />
        {preview && (
          <View style={[styles.sheet, { backgroundColor: colors.surface, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, padding: spacing.xl, gap: spacing.md }]}>
            <View style={[styles.grabber, { backgroundColor: colors.border }]} />
            <View style={[styles.bigTile, { backgroundColor: habitColors[preview.color], borderRadius: radius.lg }]}>
              <HabitIcon name={preview.icon} size={30} color={readableOn(habitColors[preview.color])} />
            </View>
            <Text accessibilityRole="header" style={[type.headline, { color: colors.text, fontWeight: '800' }]}>{t(`templates.${preview.id}.name`)}</Text>
            <Text style={[type.body, { color: colors.textMuted }]}>{summary(preview)}</Text>
            <Text style={[type.body, { color: colors.textMuted }]}>{t('templatesScreen.reminderAt', { time: clock.time(preview.reminder) })}</Text>
            <PrimaryButton label={t('templatesScreen.addHabit')} onPress={() => add(preview)} />
            <TextButton
              label={t('templatesScreen.editFirst')}
              onPress={() => {
                const id = preview.id;
                setPreview(null);
                router.replace({ pathname: '/habit/new', params: { template: id } });
              }}
            />
          </View>
        )}
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  tile: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  bigTile: { width: 64, height: 64, alignItems: 'center', justifyContent: 'center' },
  grabber: { alignSelf: 'center', width: 40, height: 5, borderRadius: 3, marginTop: -8, marginBottom: 8 },
  scrim: { flex: 1, backgroundColor: '#0000007A' },
  sheet: { paddingBottom: 40 },
});
