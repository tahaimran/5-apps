import { Tabs } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { t } from '@shared/i18n';
import { useTheme } from '@shared/theme';

const icons = { timer: 'timer-outline', kicks: 'foot-print', pregnancy: 'human-pregnant', more: 'dots-horizontal' } as const;

export default function TabsLayout() {
  const { colors, touchTarget, type } = useTheme();
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
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border, minHeight: touchTarget + 16 },
      }}
    >
      {tab('timer')}
      {tab('kicks')}
      {tab('pregnancy')}
      {tab('more')}
    </Tabs>
  );
}
