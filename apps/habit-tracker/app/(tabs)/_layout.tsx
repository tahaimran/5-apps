import { Tabs } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { t } from '@shared/i18n';
import { useTheme } from '@shared/theme';

const icons = {
  index: 'check-circle-outline',
  stats: 'chart-box-outline',
  settings: 'cog-outline',
} as const;

export default function TabsLayout() {
  const { colors, touchTarget } = useTheme();
  const tab = (name: keyof typeof icons, title: string) => (
    <Tabs.Screen
      name={name}
      options={{
        title,
        tabBarAccessibilityLabel: title,
        tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name={icons[name]} size={size} color={color as string} />,
      }}
    />
  );
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border, minHeight: touchTarget + 8 },
      }}
    >
      {tab('index', t('tabs.today'))}
      {tab('stats', t('tabs.stats'))}
      {tab('settings', t('tabs.settings'))}
    </Tabs>
  );
}
