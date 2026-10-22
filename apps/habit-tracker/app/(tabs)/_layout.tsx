import { StyleSheet, View } from 'react-native';
import { Tabs } from 'expo-router';
import CalendarCheck from 'lucide-react-native/icons/calendar-check';
import ChartColumn from 'lucide-react-native/icons/chart-column';
import Settings from 'lucide-react-native/icons/settings';
import { t } from '@shared/i18n';
import { useTheme } from '@shared/theme';
import type { IconComponent } from '@shared/ui';
import { fonts } from '@/theme/tokens';

const icons: Record<'index' | 'stats' | 'settings', IconComponent> = {
  index: CalendarCheck,
  stats: ChartColumn,
  settings: Settings,
};

export default function TabsLayout() {
  const { colors, touchTarget, shadow } = useTheme();
  const tab = (name: keyof typeof icons, title: string) => {
    const Icon = icons[name];
    return (
      <Tabs.Screen
        name={name}
        options={{
          title,
          tabBarAccessibilityLabel: title,
          // The active tab sits in a soft pill; tabs never slide (they are peers, not a hierarchy).
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.pill, { backgroundColor: focused ? colors.primarySoft : 'transparent' }]}>
              <Icon size={22} color={color as string} strokeWidth={focused ? 2.4 : 2} />
            </View>
          ),
        }}
      />
    );
  };
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        animation: 'none',
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: { fontFamily: fonts.body, fontWeight: '600', fontSize: 12 },
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopWidth: 0,
          minHeight: touchTarget + 20,
          paddingTop: 6,
          ...shadow(2),
        },
      }}
    >
      {tab('index', t('tabs.today'))}
      {tab('stats', t('tabs.stats'))}
      {tab('settings', t('tabs.settings'))}
    </Tabs>
  );
}

const styles = StyleSheet.create({
  pill: { width: 60, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
});
