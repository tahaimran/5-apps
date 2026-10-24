import { Pressable, StyleSheet, View, type PressableProps } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Tabs } from 'expo-router';
import ChartColumn from 'lucide-react-native/icons/chart-column';
import GlassWater from 'lucide-react-native/icons/glass-water';
import Sprout from 'lucide-react-native/icons/sprout';
import { t } from '@shared/i18n';
import { useTheme } from '@shared/theme';
import type { IconComponent } from '@shared/ui';
import { fonts } from '@/theme/tokens';

const icons: Record<'index' | 'history' | 'garden', IconComponent> = {
  index: GlassWater,
  history: ChartColumn,
  garden: Sprout,
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
              <Icon size={20} color={color as string} strokeWidth={focused ? 2.4 : 2} />
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
        tabBarLabelStyle: { fontFamily: fonts.body, fontWeight: '600', fontSize: 11, lineHeight: 14 },
        tabBarIconStyle: { height: 26 },
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopWidth: 0,
          // Compact: icons and labels in ~56dp, plus the system gesture area.
          height: 56 + insets.bottom,
          paddingTop: 5,
          paddingBottom: insets.bottom + 4,
          ...shadow(2),
        },
      }}
    >
      {tab('index', t('tabs.today'))}
      {tab('history', t('tabs.history'))}
      {tab('garden', t('tabs.garden'))}
    </Tabs>
  );
}

const styles = StyleSheet.create({
  pill: { width: 52, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
});
