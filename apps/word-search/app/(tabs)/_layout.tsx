import { Tabs } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { t } from '@shared/i18n';
import { useTheme } from '@shared/theme';
import { FONT_BOLD } from '@/ui/AppText';

const icons = { index: 'magnify', daily: 'calendar-check-outline', settings: 'cog-outline' } as const;

export default function TabsLayout() {
  const { colors, touchTarget, type } = useTheme();
  const tab = (name: keyof typeof icons, title: string) => (
    <Tabs.Screen
      name={name}
      options={{
        title,
        tabBarAccessibilityLabel: title,
        tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name={icons[name]} size={size + 4} color={color as string} />,
      }}
    />
  );
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        // Labels are always visible (plan §4).
        tabBarShowLabel: true,
        tabBarLabelStyle: { fontFamily: FONT_BOLD, fontSize: type.caption.fontSize + 2 },
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border, minHeight: touchTarget + 16 },
      }}
    >
      {tab('index', t('tabs.play'))}
      {tab('daily', t('tabs.daily'))}
      {tab('settings', t('tabs.settings'))}
    </Tabs>
  );
}
