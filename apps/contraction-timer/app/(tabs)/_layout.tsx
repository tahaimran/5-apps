import { Pressable, StyleSheet, View, useWindowDimensions, type PressableProps } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Tabs } from 'expo-router';
import Baby from 'lucide-react-native/icons/baby';
import Ellipsis from 'lucide-react-native/icons/ellipsis';
import Footprints from 'lucide-react-native/icons/footprints';
import Timer from 'lucide-react-native/icons/timer';
import { t } from '@shared/i18n';
import { useTheme } from '@shared/theme';
import type { IconComponent } from '@shared/ui';
import { openContraction } from '@/domain/stats';
import { useSessions } from '@/store/sessions';
import { useSettings } from '@/store/settings';
import { fonts, tabBarHeight } from '@/theme/tokens';

const icons: Record<'timer' | 'kicks' | 'pregnancy' | 'more', IconComponent> = { timer: Timer, kicks: Footprints, pregnancy: Baby, more: Ellipsis };

export default function TabsLayout() {
  const { colors, shadow } = useTheme();
  const insets = useSafeAreaInsets();
  const { fontScale } = useWindowDimensions();
  // Plan §4: the tab bar goes while a contraction is running in Partner mode, so it cannot be tapped by mistake.
  const partner = useSettings((s) => s.settings.partnerMode);
  const running = useSessions((s) => !!s.active && openContraction(s.active.contractions) !== null);
  const hideBar = partner && running;
  const tab = (name: keyof typeof icons) => {
    const Icon = icons[name];
    return (
      <Tabs.Screen
        name={name}
        options={{
          title: t(`tabs.${name}`),
          tabBarAccessibilityLabel: t(`tabs.${name}`),
          // The active tab sits in a soft pill; tabs never slide (they are peers, not a hierarchy).
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.pill, { backgroundColor: focused ? colors.primarySoft : 'transparent' }]}>
              <Icon size={21} color={color as string} strokeWidth={focused ? 2.4 : 2} />
            </View>
          ),
        }}
      />
    );
  };
  return (
    <Tabs
      initialRouteName="timer"
      screenOptions={{
        headerShown: false,
        animation: 'none',
        // No Android ripple: the active pill is the feedback, and a borderless ripple spilled over the bar.
        tabBarButton: ({ android_ripple: _ripple, ...props }) => <Pressable {...(props as PressableProps)} />,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        // Labels are always visible, so no tab is a bare icon. An explicit line height keeps descenders from clipping.
        tabBarShowLabel: true,
        tabBarLabelStyle: { fontFamily: fonts.body, fontWeight: '600', fontSize: 12, lineHeight: 15 },
        tabBarIconStyle: { height: 28 },
        tabBarStyle: hideBar
          ? { display: 'none' }
          : {
              backgroundColor: colors.surface,
              borderTopWidth: 0,
              height: tabBarHeight(fontScale) + insets.bottom,
              paddingTop: 5,
              paddingBottom: insets.bottom + 4,
              ...shadow(2),
            },
      }}
    >
      {tab('timer')}
      {tab('kicks')}
      {tab('pregnancy')}
      {tab('more')}
    </Tabs>
  );
}

const styles = StyleSheet.create({
  pill: { width: 56, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
});
