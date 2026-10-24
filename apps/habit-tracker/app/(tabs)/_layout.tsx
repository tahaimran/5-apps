import { Pressable, StyleSheet, View, type PressableProps } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
  const { colors, shadow } = useTheme();
  const insets = useSafeAreaInsets();
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
        // No Android ripple: the active pill is the feedback, and a borderless ripple spilled over the bar.
        tabBarButton: ({ android_ripple: _ripple, ...props }) => <Pressable {...(props as PressableProps)} />,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        // An explicit line height keeps descenders (y, g) from clipping under the pill icon.
        tabBarLabelStyle: { fontFamily: fonts.body, fontWeight: '600', fontSize: 12, lineHeight: 16, marginTop: 2 },
        tabBarIconStyle: { height: 32 },
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopWidth: 0,
          height: 72 + insets.bottom,
          paddingTop: 8,
          paddingBottom: insets.bottom + 8,
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
