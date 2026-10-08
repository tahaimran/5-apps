import { useMemo, useState } from 'react';
import { Modal, Pressable, SectionList, StyleSheet, Text, View } from 'react-native';
import { Stack, router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { t } from '@shared/i18n';
import { useTheme } from '@shared/theme';
import { templates, type Template } from '@/data/templates';
import { categories } from '@/domain/categories';
import { draftFromTemplate } from '@/features/habit-editor/drafts';
import { useHabits } from '@/store/habits';
import { useToday } from '@/store/today';
import { PrimaryButton, TextButton, TextField } from '@/ui/controls';
import { scheduleLabel } from '@/ui/format';
import { habitColors } from '@/theme/tokens';

const targetLabel = (tpl: Template) =>
  tpl.type === 'count'
    ? t('templatesScreen.target_count', { target: tpl.target, unit: t(`templates.${tpl.id}.unit`) })
    : tpl.type === 'timer'
      ? t('templatesScreen.target_timer', { target: tpl.target })
      : t('templatesScreen.target_boolean');

const summary = (tpl: Template) => `${targetLabel(tpl)} · ${scheduleLabel(tpl.schedule)}`;

export default function Templates() {
  const { colors, spacing, radius, type, touchTarget } = useTheme();
  const today = useToday((s) => s.today);
  const addHabit = useHabits((s) => s.addHabit);
  const [query, setQuery] = useState('');
  const [preview, setPreview] = useState<Template | null>(null);

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
        contentContainerStyle={{ padding: spacing.lg, paddingTop: 0, gap: spacing.sm }}
        stickySectionHeadersEnabled={false}
        ListEmptyComponent={
          <Text style={[type.body, { color: colors.textMuted }]}>{t('templatesScreen.empty', { query })}</Text>
        }
        renderSectionHeader={({ section }) => (
          <Text accessibilityRole="header" style={[type.title, { color: colors.text, marginTop: spacing.lg }]}>
            {section.title}
          </Text>
        )}
        renderItem={({ item }) => (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${t(`templates.${item.id}.name`)}. ${summary(item)}`}
            onPress={() => setPreview(item)}
            style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.md, padding: spacing.md, minHeight: touchTarget + 16 }]}
          >
            <View style={[styles.tile, { backgroundColor: habitColors[item.color] + '26', borderRadius: radius.md }]}>
              <MaterialCommunityIcons name={item.icon as never} size={24} color={habitColors[item.color]} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[type.bodyLarge, { color: colors.text, fontWeight: '600' }]}>{t(`templates.${item.id}.name`)}</Text>
              <Text style={[type.caption, { color: colors.textMuted }]}>{summary(item)}</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={22} color={colors.textMuted} />
          </Pressable>
        )}
      />

      <Modal visible={preview !== null} transparent animationType="slide" onRequestClose={() => setPreview(null)}>
        <Pressable accessibilityLabel={t('common.close')} style={styles.scrim} onPress={() => setPreview(null)} />
        {preview && (
          <View style={[styles.sheet, { backgroundColor: colors.surface, borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg, padding: spacing.xl, gap: spacing.md }]}>
            <View style={[styles.tile, { backgroundColor: habitColors[preview.color] + '26', borderRadius: radius.md }]}>
              <MaterialCommunityIcons name={preview.icon as never} size={24} color={habitColors[preview.color]} />
            </View>
            <Text accessibilityRole="header" style={[type.headline, { color: colors.text }]}>{t(`templates.${preview.id}.name`)}</Text>
            <Text style={[type.body, { color: colors.textMuted }]}>{summary(preview)}</Text>
            <Text style={[type.body, { color: colors.textMuted }]}>{t('templatesScreen.reminderAt', { time: preview.reminder })}</Text>
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
  card: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: StyleSheet.hairlineWidth },
  tile: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  scrim: { flex: 1, backgroundColor: '#00000066' },
  sheet: {},
});
