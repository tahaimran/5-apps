import Apple from 'lucide-react-native/icons/apple';
import BookOpen from 'lucide-react-native/icons/book-open';
import ChartColumn from 'lucide-react-native/icons/chart-column';
import Clapperboard from 'lucide-react-native/icons/clapperboard';
import Earth from 'lucide-react-native/icons/earth';
import EighthNotes from 'lucide-react-native/icons/eighth-notes';
import Flag from 'lucide-react-native/icons/flag';
import FlaskConical from 'lucide-react-native/icons/flask-conical';
import Landmark from 'lucide-react-native/icons/landmark';
import Layers2 from 'lucide-react-native/icons/layers-2';
import Lightbulb from 'lucide-react-native/icons/lightbulb';
import PawPrint from 'lucide-react-native/icons/paw-print';
import Puzzle from 'lucide-react-native/icons/puzzle';
import Route from 'lucide-react-native/icons/route';
import SkipForward from 'lucide-react-native/icons/skip-forward';
import Split from 'lucide-react-native/icons/split';
import TimerReset from 'lucide-react-native/icons/timer-reset';
import Trophy from 'lucide-react-native/icons/trophy';
import Zap from 'lucide-react-native/icons/zap';
import type { IconComponent } from '@shared/ui';
import type { LifelineKind } from '@/domain/lifelines';
import type { CategoryId } from '@/domain/types';

/** One Lucide icon per category (imported one at a time; icons.static.test.ts checks each exists). */
export const categoryIcons: Record<CategoryId, IconComponent> = {
  general: Lightbulb,
  geography: Earth,
  history: Landmark,
  science: FlaskConical,
  movies: Clapperboard,
  music: EighthNotes,
  sports: Trophy,
  animals: PawPrint,
  food: Apple,
  literature: BookOpen,
  logic: Puzzle,
  flags: Flag,
};

export const modeIcons = { classic: Route, category: Layers2, blitz: Zap, stats: ChartColumn } as const satisfies Record<string, IconComponent>;

export const lifelineIcons: Record<LifelineKind, IconComponent> = { fifty: Split, skip: SkipForward, time: TimerReset };
