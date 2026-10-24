const channel = (v: number) => {
  const c = v / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
};

export function luminance(hex: string): number {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.replace(/(.)/g, '$1$1') : h.slice(0, 6), 16);
  return 0.2126 * channel((n >> 16) & 255) + 0.7152 * channel((n >> 8) & 255) + 0.0722 * channel(n & 255);
}

/** WCAG contrast ratio between two hex colors (1 to 21). */
export function contrastRatio(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/** Black or white, whichever reads better on `background`. */
export function readableOn(background: string): '#FFFFFF' | '#0F1115' {
  return contrastRatio('#FFFFFF', background) >= contrastRatio('#0F1115', background) ? '#FFFFFF' : '#0F1115';
}

const rgb = (hex: string) => {
  const n = parseInt(hex.replace('#', '').slice(0, 6), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
const hex2 = (v: number) => Math.round(v).toString(16).padStart(2, '0').toUpperCase();

/** The opaque color a `#RRGGBBAA` overlay makes on top of `under` (a frosted chip on a gradient). */
export function blend(overlay: string, under: string): string {
  const h = overlay.replace('#', '');
  const alpha = h.length === 8 ? parseInt(h.slice(6), 16) / 255 : 1;
  const [a, b] = [rgb(overlay), rgb(under)];
  return `#${a.map((v, i) => hex2(v * alpha + b[i] * (1 - alpha))).join('')}`;
}

/** Each channel of a color as a fraction of full (0…1): Night mode keeps green and blue low. */
export const channels = (hex: string): { r: number; g: number; b: number } => {
  const [r, g, b] = rgb(hex);
  return { r: r / 255, g: g / 255, b: b / 255 };
};
