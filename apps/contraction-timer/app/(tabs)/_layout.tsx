import { Tabs } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { t } from '@shared/i18n';
import { useTheme } from '@shared/theme';
import { openContraction } from '@/domain/stats';
import { useSessions } from '@/store/sessions';
import { useSettings } from '@/store/settings';

const icons = { timer: 'timer-outline', kicks: 'foot-print', pregnancy: 'human-pregnant', more: 'dots-horizontal' } as const;

export default function TabsLayout() {
  const { colors, touchTarget, type } = useTheme();
  // Plan §4: the tab bar goes while a contraction is running in Partner mode, so it cannot be tapped by mistake.
  const partner = useSettings((s) => s.settings.partnerMode);
  const running = useSessions((s) => !!s.active && openContraction(s.active.contractions) !== null);
  const hideBar = partner && running;
  const tab = (name: keyof typeof icons) => (
    <Tabs.Screen
      name={name}
      options={{
        title: t(`tabs.${name}`),
        tabBarAccessibilityLabel: t(`tabs.${name}`),
        tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name={icons[name]} size={size + 4} color={color as string} />,
      }}
    />
  );
  return (
    <Tabs
      initialRouteName="timer"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.text,
        tabBarInactiveTintColor: colors.textMuted,
        // Labels are always visible, so no tab is a bare icon.
        tabBarShowLabel: true,
        tabBarLabelStyle: { fontSize: type.caption.fontSize + 1, fontWeight: '600' },
        tabBarStyle: hideBar ? { display: 'none' } : { backgroundColor: colors.surface, borderTopColor: colors.border, minHeight: touchTarget + 16 },
      }}
    >
      {tab('timer')}
      {tab('kicks')}
      {tab('pregnancy')}
      {tab('more')}
    </Tabs>
  );
}
