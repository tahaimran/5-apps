import { Tabs } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { t } from '@shared/i18n';
import { useTheme } from '@shared/theme';
import { FONT_SEMIBOLD } from '@/ui/AppText';

const icons = { index: 'home-variant-outline', play: 'play-circle-outline', stats: 'chart-box-outline', settings: 'cog-outline' } as const;

export default function TabsLayout() {
  const { colors, touchTarget, type } = useTheme();
  const tab = (name: keyof typeof icons, title: string) => (
    <Tabs.Screen
      name={name}
      options={{
        title,
        tabBarAccessibilityLabel: title,
        tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name={icons[name]} size={size + 2} color={color as string} />,
      }}
    />
  );
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarShowLabel: true,
        tabBarLabelStyle: { fontFamily: FONT_SEMIBOLD, fontSize: type.caption.fontSize },
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border, minHeight: touchTarget + 16 },
      }}
    >
      {tab('index', t('tabs.home'))}
      {tab('play', t('tabs.play'))}
      {tab('stats', t('tabs.stats'))}
      {tab('settings', t('tabs.settings'))}
    </Tabs>
  );
}
