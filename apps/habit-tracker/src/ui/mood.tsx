import FaceAngry from 'lucide-react-native/icons/face-angry';
import FaceGrinning from 'lucide-react-native/icons/face-grinning';
import FaceNeutral from 'lucide-react-native/icons/face-neutral';
import FaceSlightlyFrowning from 'lucide-react-native/icons/face-slightly-frowning';
import FaceSlightlySmiling from 'lucide-react-native/icons/face-slightly-smiling';
import type { IconComponent } from '@shared/ui';

/** Mood 1 (very bad) … 5 (great) as line faces instead of emoji, so they follow the theme. */
export const moodIcons: Record<1 | 2 | 3 | 4 | 5, IconComponent> = {
  1: FaceAngry,
  2: FaceSlightlyFrowning,
  3: FaceNeutral,
  4: FaceSlightlySmiling,
  5: FaceGrinning,
};

export function MoodIcon({ mood, size = 24, color }: { mood: number; size?: number; color?: string }) {
  const Icon = moodIcons[Math.min(5, Math.max(1, Math.round(mood))) as 1 | 2 | 3 | 4 | 5];
  return <Icon size={size} color={color} strokeWidth={2} />;
}
