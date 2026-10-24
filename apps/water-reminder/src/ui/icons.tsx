import Svg, { Path } from 'react-native-svg';
import Armchair from 'lucide-react-native/icons/armchair';
import Bike from 'lucide-react-native/icons/bike';
import Citrus from 'lucide-react-native/icons/citrus';
import CloudSun from 'lucide-react-native/icons/cloud-sun';
import Coffee from 'lucide-react-native/icons/coffee';
import CupSoda from 'lucide-react-native/icons/cup-soda';
import Droplets from 'lucide-react-native/icons/droplets';
import Dumbbell from 'lucide-react-native/icons/dumbbell';
import Footprints from 'lucide-react-native/icons/footprints';
import GlassWater from 'lucide-react-native/icons/glass-water';
import Leaf from 'lucide-react-native/icons/leaf';
import Milk from 'lucide-react-native/icons/milk';
import Snowflake from 'lucide-react-native/icons/snowflake';
import Sun from 'lucide-react-native/icons/sun';
import ThermometerSun from 'lucide-react-native/icons/thermometer-sun';
import type { IconComponent } from '@shared/ui';
import type { Activity, BeverageId, Climate } from '@/domain/types';

/** A water bottle drawn in Lucide's grid and stroke style (Lucide has only a wine bottle). */
export function Bottle({ size = 24, color = '#000', strokeWidth = 2 }: { size?: number; color?: string; strokeWidth?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M10 2h4" />
      <Path d="M10.5 2v2.5L8.6 6.8A3 3 0 0 0 8 8.6V20a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V8.6a3 3 0 0 0-.6-1.8L13.5 4.5V2" />
      <Path d="M8 12.5h8" />
    </Svg>
  );
}

/**
 * Cup icons are stored by name (backups from older versions carry the original names), so the
 * screen maps them here. Anything unknown is a glass.
 */
const CUP_ICONS: Record<string, IconComponent> = {
  'cup-water': GlassWater,
  'coffee-outline': Coffee,
  'bottle-tonic-outline': Bottle,
  glass: GlassWater,
  mug: Coffee,
  bottle: Bottle,
};

export const cupIcon = (name: string): IconComponent => CUP_ICONS[name] ?? GlassWater;

export const beverageIcons: Record<BeverageId, IconComponent> = {
  water: GlassWater,
  sparkling: Droplets,
  tea: Leaf,
  milk: Milk,
  juice: Citrus,
  coffee: Coffee,
  soda: CupSoda,
};

export const activityIcons: Record<Activity, IconComponent> = {
  sedentary: Armchair,
  light: Footprints,
  active: Bike,
  very_active: Dumbbell,
};

export const climateIcons: Record<Climate, IconComponent> = {
  cool: Snowflake,
  mild: CloudSun,
  warm: Sun,
  hot: ThermometerSun,
};
