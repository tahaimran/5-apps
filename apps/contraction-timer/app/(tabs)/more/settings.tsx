import { useState } from 'react';
import { router } from 'expo-router';
import Activity from 'lucide-react-native/icons/activity';
import Bell from 'lucide-react-native/icons/bell';
import BellRing from 'lucide-react-native/icons/bell-ring';
import CalendarHeart from 'lucide-react-native/icons/calendar-heart';
import Clock from 'lucide-react-native/icons/clock';
import Footprints from 'lucide-react-native/icons/footprints';
import Ruler from 'lucide-react-native/icons/ruler';
import SunMoon from 'lucide-react-native/icons/sun-moon';
import Users from 'lucide-react-native/icons/users';
import Vibrate from 'lucide-react-native/icons/vibrate';
import Volume2 from 'lucide-react-native/icons/volume-2';
import { t } from '@shared/i18n';
import { deviceTimeFormat } from '@shared/time';
import { Stepper } from '@shared/ui';
import { KickReminderSheet } from '@/components/KickReminderSheet';
import { KICK_TARGET_LIMITS } from '@/domain/defaults';
import { clampTarget } from '@/domain/kicks';
import { ruleText } from '@/domain/summary';
import type { ThemePref } from '@/domain/types';
import { setWeeklyCards } from '@/notifications/weekly';
import { useSettings } from '@/store/settings';
import { useThemePref } from '@/theme/mode';
import { THEME_PREFS } from '@/theme/tokens';
import { ChoiceGroup } from '@/ui/Choice';
import { timeOfDay, useClock24h } from '@/ui/format';
import { Screen } from '@/ui/Screen';
import { NavRow, RowBlock, SettingsGroup, SwitchRow } from '@/ui/SettingsRow';

const THEME_LABEL: Record<ThemePref, string> = { system: 'settings.themeSystem', light: 'settings.themeLight', dark: 'settings.themeDark', night: 'settings.themeNight' };
type ClockChoice = 'phone' | '12h' | '24h';

/** Plan §5.5: the pattern rule, colors (Night included), Partner mode, vibration, sounds, clock, units, kick target and reminders. */
export default function Settings() {
  const settings = useSettings((s) => s.settings);
  const update = useSettings((s) => s.update);
  const [pref, setPref] = useThemePref();
  const [sheet, setSheet] = useState(false);
  const clock24h = useClock24h();
  const reminder = settings.kickReminder;
  const reminderState = reminder.enabled ? timeOfDay(reminder.hour, reminder.minute, clock24h) : t('common.off');
  const phoneClock = t(deviceTimeFormat() === '24h' ? 'settings.clock24' : 'settings.clock12');

  return (
    <Screen stack title={t('settings.title')}>
      <SettingsGroup title={t('settings.alertsSection')}>
        <SwitchRow icon={Bell} label={t('settings.alerts')} hint={t('settings.alertsHint')} value={settings.patternAlerts} onChange={(patternAlerts) => update({ patternAlerts })} />
        <NavRow icon={Activity} label={t('settings.ruleLabel')} value={ruleText(settings.rule)} accessibilityHint={t('settings.ruleHint')} onPress={() => router.push('/modals/alert-rule')} />
      </SettingsGroup>

      <SettingsGroup title={t('settings.lookSection')}>
        <RowBlock icon={SunMoon} label={t('settings.theme')}>
          <ChoiceGroup
            options={THEME_PREFS.map((p) => ({ value: p, label: t(`settings.themeShort.${p}`), accessibilityLabel: t(THEME_LABEL[p]) }))}
            value={pref}
            onChange={setPref}
          />
        </RowBlock>
        <SwitchRow icon={Users} label={t('settings.partner')} hint={t('settings.partnerHint')} value={settings.partnerMode} onChange={(partnerMode) => update({ partnerMode })} />
      </SettingsGroup>

      <SettingsGroup title={t('settings.feelSection')}>
        <SwitchRow icon={Vibrate} label={t('settings.haptics')} hint={t('settings.hapticsHint')} value={settings.haptics} onChange={(haptics) => update({ haptics })} />
        <SwitchRow icon={Volume2} label={t('settings.sounds')} hint={t('settings.soundsHint')} value={settings.sounds} onChange={(sounds) => update({ sounds })} />
        <RowBlock icon={Clock} label={t('settings.clock')}>
          <ChoiceGroup<ClockChoice>
            options={[
              { value: 'phone', label: t('settings.clockPhone'), accessibilityLabel: t('settings.clockPhoneLabel', { format: phoneClock }) },
              { value: '12h', label: t('settings.clock12') },
              { value: '24h', label: t('settings.clock24') },
            ]}
            value={settings.timeFormat ?? 'phone'}
            onChange={(v) => update({ timeFormat: v === 'phone' ? undefined : v })}
          />
        </RowBlock>
        <RowBlock icon={Ruler} label={t('settings.units')}>
          <ChoiceGroup
            options={[
              { value: 'metric', label: t('settings.unitsMetricShort'), accessibilityLabel: t('settings.unitsMetric') },
              { value: 'imperial', label: t('settings.unitsImperialShort'), accessibilityLabel: t('settings.unitsImperial') },
            ]}
            value={settings.units}
            onChange={(units) => update({ units })}
          />
        </RowBlock>
      </SettingsGroup>

      <SettingsGroup title={t('settings.kicksSection')}>
        <RowBlock icon={Footprints} label={t('settings.kickTarget')}>
          <Stepper
            label={t('settings.kickTarget')}
            value={settings.kickTarget}
            min={KICK_TARGET_LIMITS.min}
            max={KICK_TARGET_LIMITS.max}
            format={(n) => t('settings.kickTargetValue', { n })}
            decreaseLabel={t('settings.kickTargetLess')}
            increaseLabel={t('settings.kickTargetMore')}
            onChange={(n) => update({ kickTarget: clampTarget(n) })}
          />
        </RowBlock>
        <NavRow icon={BellRing} label={t('settings.kickReminder')} value={reminderState} onPress={() => setSheet(true)} />
        <SwitchRow icon={CalendarHeart} label={t('settings.weekly')} hint={t('settings.weeklyHint')} value={settings.weeklyCardNotif} onChange={(on) => void setWeeklyCards(on)} />
      </SettingsGroup>

      <KickReminderSheet visible={sheet} onClose={() => setSheet(false)} />
    </Screen>
  );
}
