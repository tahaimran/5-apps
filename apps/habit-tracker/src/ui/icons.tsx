import AlarmClock from 'lucide-react-native/icons/alarm-clock';
import Apple from 'lucide-react-native/icons/apple';
import Ban from 'lucide-react-native/icons/ban';
import Banknote from 'lucide-react-native/icons/banknote';
import BedDouble from 'lucide-react-native/icons/bed-double';
import BicepsFlexed from 'lucide-react-native/icons/biceps-flexed';
import Bike from 'lucide-react-native/icons/bike';
import BookOpen from 'lucide-react-native/icons/book-open';
import Brain from 'lucide-react-native/icons/brain';
import Briefcase from 'lucide-react-native/icons/briefcase';
import Broom from 'lucide-react-native/icons/broom';
import CalendarCheck from 'lucide-react-native/icons/calendar-check';
import Camera from 'lucide-react-native/icons/camera';
import CandyOff from 'lucide-react-native/icons/candy-off';
import Car from 'lucide-react-native/icons/car';
import CigaretteOff from 'lucide-react-native/icons/cigarette-off';
import CircleCheck from 'lucide-react-native/icons/circle-check';
import CircleEllipsis from 'lucide-react-native/icons/circle-ellipsis';
import ClipboardCheck from 'lucide-react-native/icons/clipboard-check';
import CodeXml from 'lucide-react-native/icons/code-xml';
import Coffee from 'lucide-react-native/icons/coffee';
import Dumbbell from 'lucide-react-native/icons/dumbbell';
import EighthNotes from 'lucide-react-native/icons/eighth-notes';
import FaceSlightlySmiling from 'lucide-react-native/icons/face-slightly-smiling';
import Flag from 'lucide-react-native/icons/flag';
import Flame from 'lucide-react-native/icons/flame';
import Flower from 'lucide-react-native/icons/flower';
import Footprints from 'lucide-react-native/icons/footprints';
import GlassWater from 'lucide-react-native/icons/glass-water';
import GraduationCap from 'lucide-react-native/icons/graduation-cap';
import Guitar from 'lucide-react-native/icons/guitar';
import Headphones from 'lucide-react-native/icons/headphones';
import Heart from 'lucide-react-native/icons/heart';
import HeartPulse from 'lucide-react-native/icons/heart-pulse';
import Hourglass from 'lucide-react-native/icons/hourglass';
import House from 'lucide-react-native/icons/house';
import Languages from 'lucide-react-native/icons/languages';
import Leaf from 'lucide-react-native/icons/leaf';
import Lightbulb from 'lucide-react-native/icons/lightbulb';
import MailCheck from 'lucide-react-native/icons/mail-check';
import MoonStar from 'lucide-react-native/icons/moon-star';
import Mountain from 'lucide-react-native/icons/mountain';
import NotebookPen from 'lucide-react-native/icons/notebook-pen';
import Palette from 'lucide-react-native/icons/palette';
import PawPrint from 'lucide-react-native/icons/paw-print';
import Pencil from 'lucide-react-native/icons/pencil';
import PersonStanding from 'lucide-react-native/icons/person-standing';
import PhoneCall from 'lucide-react-native/icons/phone-call';
import PhoneOff from 'lucide-react-native/icons/phone-off';
import PiggyBank from 'lucide-react-native/icons/piggy-bank';
import Pill from 'lucide-react-native/icons/pill';
import ShoppingCart from 'lucide-react-native/icons/shopping-cart';
import ShowerHead from 'lucide-react-native/icons/shower-head';
import SportShoe from 'lucide-react-native/icons/sport-shoe';
import Star from 'lucide-react-native/icons/star';
import Sun from 'lucide-react-native/icons/sun';
import Target from 'lucide-react-native/icons/target';
import Toothbrush from 'lucide-react-native/icons/toothbrush';
import Trees from 'lucide-react-native/icons/trees';
import Unplug from 'lucide-react-native/icons/unplug';
import Utensils from 'lucide-react-native/icons/utensils';
import UtensilsCrossed from 'lucide-react-native/icons/utensils-crossed';
import WashingMachine from 'lucide-react-native/icons/washing-machine';
import WavesHorizontal from 'lucide-react-native/icons/waves-horizontal';
import Wind from 'lucide-react-native/icons/wind';
import WineOff from 'lucide-react-native/icons/wine-off';
import type { IconComponent } from '@shared/ui';

/**
 * Habits store MaterialCommunityIcons names (data/icons.ts, templates, categories, backups).
 * They render as Lucide line icons through this map; unknown names fall back to a target.
 * Per-icon imports keep the bundle to the icons actually used.
 */
const habitIconMap: Record<string, IconComponent> = {
  run: SportShoe,
  walk: Footprints,
  bike: Bike,
  dumbbell: Dumbbell,
  yoga: PersonStanding,
  swim: WavesHorizontal,
  'arm-flex': BicepsFlexed,
  stairs: Mountain,
  'heart-pulse': HeartPulse,
  'cup-water': GlassWater,
  pill: Pill,
  'food-apple': Apple,
  sleep: MoonStar,
  bed: BedDouble,
  'bed-clock': AlarmClock,
  'tooth-outline': Toothbrush,
  'weather-sunny': Sun,
  meditation: Brain,
  'notebook-edit-outline': NotebookPen,
  'heart-outline': Heart,
  'emoticon-happy-outline': FaceSlightlySmiling,
  'tree-outline': Trees,
  leaf: Leaf,
  'weather-windy': Wind,
  'phone-in-talk-outline': PhoneCall,
  'book-open-variant': BookOpen,
  'school-outline': GraduationCap,
  translate: Languages,
  headphones: Headphones,
  'guitar-acoustic': Guitar,
  'code-tags': CodeXml,
  'lightbulb-on-outline': Lightbulb,
  'palette-outline': Palette,
  music: EighthNotes,
  'camera-outline': Camera,
  'pencil-outline': Pencil,
  target: Target,
  'clipboard-check-outline': ClipboardCheck,
  'timer-sand': Hourglass,
  broom: Broom,
  'email-check-outline': MailCheck,
  'calendar-check-outline': CalendarCheck,
  'briefcase-outline': Briefcase,
  cash: Banknote,
  'piggy-bank-outline': PiggyBank,
  'cart-off': ShoppingCart,
  'smoking-off': CigaretteOff,
  'glass-cocktail-off': WineOff,
  'cellphone-off': PhoneOff,
  'coffee-outline': Coffee,
  'coffee-off-outline': Coffee,
  'silverware-fork-knife': Utensils,
  'food-off-outline': UtensilsCrossed,
  paw: PawPrint,
  'flower-outline': Flower,
  'home-outline': House,
  'car-outline': Car,
  'washing-machine': WashingMachine,
  shower: ShowerHead,
  'star-outline': Star,
  'flag-outline': Flag,
  fire: Flame,
  'candy-off-outline': CandyOff,
  'power-plug-off-outline': Unplug,
  'shoe-print': Footprints,
  cancel: Ban,
  'check-circle-outline': CircleCheck,
  'dots-horizontal-circle-outline': CircleEllipsis,
};

export function habitIcon(name: string): IconComponent {
  return habitIconMap[name] ?? Target;
}

export function HabitIcon({ name, size = 24, color, strokeWidth = 2 }: { name: string; size?: number; color?: string; strokeWidth?: number }) {
  const Icon = habitIcon(name);
  return <Icon size={size} color={color} strokeWidth={strokeWidth} />;
}

/** Whether a stored icon name has its own Lucide icon (instead of the fallback). */
export const hasHabitIcon = (name: string) => name in habitIconMap;
