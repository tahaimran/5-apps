import { Pressable, StyleSheet, View, useWindowDimensions, type PressableProps } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Tabs } from 'expo-router';
import CalendarCheck from 'lucide-react-native/icons/calendar-check';
import Search from 'lucide-react-native/icons/search';
import Settings from 'lucide-react-native/icons/settings';
import { t } from '@shared/i18n';
import { useTheme } from '@shared/theme';
import type { IconComponent } from '@shared/ui';
import { fonts, tabBarHeight } from '@/theme/tokens';

const icons: Record<'index' | 'daily' | 'settings', IconComponent> = { index: Search, daily: CalendarCheck, settings: Settings };
const titles = { index: 'tabs.play', daily: 'tabs.daily', settings: 'tabs.settings' } as const;

/** Three tabs with labels always visible (plan §4): a compact bar like Habits, no ripple, no sliding. */
export default function TabsLayout() {
  const { colors, shadow, mode } = useTheme();
  const insets = useSafeAreaInsets();
  const { fontScale } = useWindowDimensions();
  const tab = (name: keyof typeof icons) => {
    const Icon = icons[name];
    return (
      <Tabs.Screen
        name={name}
        options={{
          title: t(titles[name]),
          tabBarAccessibilityLabel: t(titles[name]),
          // The active tab sits in a soft pill (a yellow ring in high contrast, never a bright fill).
          tabBarIcon: ({ color, focused }) => (
            <View
              style={[
                styles.pill,
                { backgroundColor: focused && mode !== 'high-contrast' ? colors.primarySoft : 'transparent', borderWidth: focused && mode === 'high-contrast' ? 2 : 0, borderColor: colors.primary },
              ]}
            >
              <Icon size={22} color={color as string} strokeWidth={focused ? 2.5 : 2} />
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
        tabBarShowLabel: true,
        tabBarLabelStyle: { fontFamily: fonts.body, fontWeight: '700', fontSize: 13, lineHeight: 16 },
        tabBarIconStyle: { height: 30 },
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopWidth: mode === 'high-contrast' ? 2 : 0,
          borderTopColor: colors.border,
          height: tabBarHeight(fontScale) + insets.bottom,
          paddingTop: 5,
          paddingBottom: insets.bottom + 4,
          ...(mode === 'high-contrast' ? {} : shadow(2)),
        },
      }}
    >
      {tab('index')}
      {tab('daily')}
      {tab('settings')}
    </Tabs>
  );
}

const styles = StyleSheet.create({
  pill: { width: 60, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
});
