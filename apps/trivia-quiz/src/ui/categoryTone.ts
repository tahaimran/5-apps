import type { ThemeMode } from '@shared/theme';
import { categoryInfo } from '@/domain/categories';
import type { CategoryId } from '@/domain/types';
import { palette } from '@/theme/tokens';

/** `fg` at `alpha` over `bg`, as hex. */
export function blend(fg: string, bg: string, alpha: number): string {
  const parse = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const [f, b] = [parse(fg), parse(bg)];
  return '#' + f.map((v, i) => Math.round(v * alpha + b[i] * (1 - alpha)).toString(16).padStart(2, '0')).join('');
}

export const SOFT_ALPHA = { light: 0.14, dark: 0.22 } as const;

/**
 * A category's colors for the current mode: `fill` carries white text (the strong shade), `icon` is the
 * hue drawn on a plain surface (the strong shade on light, the bright hue on dark, so both keep 3:1),
 * and `soft` is a tint of the hue for icon circles and bar tracks. Checked by the contrast test.
 */
export function categoryTone(id: CategoryId, mode: ThemeMode) {
  const c = categoryInfo(id);
  const dark = mode !== 'light';
  const surface = (dark ? palette.dark?.surface : palette.light?.surface) ?? '#FFFFFF';
  return {
    fill: c.strong,
    icon: dark ? c.color : c.strong,
    soft: blend(c.color, surface, dark ? SOFT_ALPHA.dark : SOFT_ALPHA.light),
  };
}
