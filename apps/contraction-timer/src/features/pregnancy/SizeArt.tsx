import Svg from 'react-native-svg';
import { useIsNight } from '@/theme/mode';
import { drawingFor, nightTone, type Tone } from './drawings';

const sameTone: Tone = (hex) => hex;

/** The drawing of `size` (a weeks.en.json size name) at `px` dp. Decoration only: the caller names it. */
export function SizeArt({ size, px }: { size: string; px: number }) {
  const night = useIsNight();
  const draw = drawingFor(size);
  if (!draw) return null;
  return (
    <Svg width={px} height={px} viewBox="0 0 100 100" importantForAccessibility="no-hide-descendants" accessible={false}>
      {draw(night ? nightTone : sameTone)}
    </Svg>
  );
}
