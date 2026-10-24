import type { ReactNode } from 'react';
import { Circle, Ellipse, G, Path, Rect } from 'react-native-svg';

/**
 * Hand-drawn pictures of what each week is compared with (weeks.en.json `size`), on a 100×100 canvas.
 * One soft, flat style: a body, a few darker details, a white highlight and a ground shadow. Every color
 * goes through `c()` so the caller can turn the whole set red for Night mode.
 */
export type Tone = (hex: string) => string;

const channel = (hex: string, i: number) => parseInt(hex.replace('#', '').slice(i * 2, i * 2 + 2), 16);
const hex2 = (n: number) => Math.round(Math.max(0, Math.min(255, n))).toString(16).padStart(2, '0').toUpperCase();

/**
 * Night mode keeps red only (plan §7): a color becomes a red of the same lightness, with green and blue
 * held under 30%, so the drawings stay readable without lighting the room.
 */
export const nightTone: Tone = (hex) => {
  const lum = (0.299 * channel(hex, 0) + 0.587 * channel(hex, 1) + 0.114 * channel(hex, 2)) / 255;
  // Capped below full red so the palest items (cauliflower, melons) do not glare on black.
  const r = 40 + lum * 180;
  return `#${hex2(r)}${hex2(Math.min(76, r * 0.22))}${hex2(Math.min(70, r * 0.17))}`;
};

const shadow = (c: Tone, w = 30) => <Ellipse cx={50} cy={93} rx={w} ry={4} fill={c('#2A2B3D')} fillOpacity={0.12} />;
const shine = (c: Tone, cx: number, cy: number, rx: number, ry: number, rot = -30) => (
  <Ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill={c('#FFFFFF')} fillOpacity={0.4} transform={`rotate(${rot} ${cx} ${cy})`} />
);
const leaf = (c: Tone, x: number, y: number, rot: number, color = '#6BAA45', s = 1) => (
  <Path d="M0 0 C6 -10 18 -10 24 0 C18 10 6 10 0 0 Z" fill={c(color)} transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`} />
);
const stem = (c: Tone, d: string, color = '#7A5230', w = 3) => <Path d={d} stroke={c(color)} strokeWidth={w} strokeLinecap="round" fill="none" />;

/** A round fruit: body, a darker lower half-moon, a highlight. */
const ball = (c: Tone, cx: number, cy: number, r: number, color: string, dark: string) => (
  <G>
    <Circle cx={cx} cy={cy} r={r} fill={c(color)} />
    <Path d={`M${cx - r * 0.92} ${cy + r * 0.25} A${r} ${r} 0 0 0 ${cx + r * 0.92} ${cy + r * 0.25} A${r * 1.1} ${r * 0.8} 0 0 1 ${cx - r * 0.92} ${cy + r * 0.25} Z`} fill={c(dark)} fillOpacity={0.55} />
    {shine(c, cx - r * 0.38, cy - r * 0.4, r * 0.22, r * 0.12)}
  </G>
);

const seedDots = (c: Tone, pts: [number, number][], color: string, r = 1.3) => pts.map(([x, y], i) => <Ellipse key={i} cx={x} cy={y} rx={r} ry={r * 1.4} fill={c(color)} />);

export const DRAWINGS: Record<string, (c: Tone) => ReactNode> = {
  'poppy seed': (c) => (
    <G>
      {shadow(c, 14)}
      <Path d="M42 62 C40 48 52 40 60 46 C68 52 64 66 54 68 C48 70 43 68 42 62 Z" fill={c('#4A4E69')} />
      {shine(c, 50, 50, 4, 2)}
      <Circle cx={30} cy={74} r={4} fill={c('#5C6080')} />
      <Circle cx={72} cy={76} r={3} fill={c('#5C6080')} />
    </G>
  ),
  'sesame seed': (c) => (
    <G>
      {shadow(c, 16)}
      <Path d="M50 30 C66 40 66 72 50 80 C34 72 34 40 50 30 Z" fill={c('#F2E2B6')} stroke={c('#D4B97A')} strokeWidth={2} />
      <Path d="M50 36 L50 74" stroke={c('#E3CD92')} strokeWidth={1.5} />
      {shine(c, 44, 48, 3, 9, 0)}
    </G>
  ),
  lentil: (c) => (
    <G>
      {shadow(c, 26)}
      <Ellipse cx={50} cy={60} rx={30} ry={20} fill={c('#D9822B')} />
      <Ellipse cx={50} cy={57} rx={24} ry={14} fill={c('#E89A45')} />
      {shine(c, 40, 52, 8, 3, -10)}
    </G>
  ),
  blueberry: (c) => (
    <G>
      {shadow(c, 26)}
      {ball(c, 50, 58, 30, '#4F6BB2', '#2F4280')}
      <Path d="M50 30 L53 36 L59 36 L54 40 L56 46 L50 42 L44 46 L46 40 L41 36 L47 36 Z" fill={c('#2E3A66')} />
    </G>
  ),
  raspberry: (c) => (
    <G>
      {shadow(c, 24)}
      {(
        [
          [40, 46], [50, 42], [60, 46], [35, 57], [45, 55], [55, 55], [65, 57], [40, 67], [50, 66], [60, 67], [45, 77], [55, 77],
        ] as const
      ).map(([x, y], i) => (
        <G key={i}>
          <Circle cx={x} cy={y} r={7.5} fill={c('#D6336C')} />
          <Circle cx={x - 2} cy={y - 2.5} r={2} fill={c('#FFFFFF')} fillOpacity={0.35} />
        </G>
      ))}
      {leaf(c, 50, 36, -150, '#5E9E3A', 0.7)}
      {leaf(c, 50, 36, -30, '#5E9E3A', 0.7)}
    </G>
  ),
  cherry: (c) => (
    <G>
      {shadow(c, 24)}
      {stem(c, 'M50 52 C52 36 58 24 70 16', '#6B8E23')}
      {leaf(c, 66, 20, -20, '#6BAA45', 0.9)}
      {ball(c, 50, 66, 22, '#C81D3A', '#8E1028')}
    </G>
  ),
  strawberry: (c) => (
    <G>
      {shadow(c, 22)}
      <Path d="M24 40 C24 30 76 30 76 40 C76 62 58 86 50 88 C42 86 24 62 24 40 Z" fill={c('#E63946')} />
      {seedDots(c, [[36, 46], [50, 44], [64, 46], [42, 58], [58, 58], [50, 70], [36, 64], [64, 64], [50, 80]], '#FFD166')}
      <Path d="M30 36 L40 26 L46 34 L50 22 L54 34 L60 26 L70 36 Z" fill={c('#4E9F3D')} />
      {shine(c, 38, 52, 4, 8, 20)}
    </G>
  ),
  fig: (c) => (
    <G>
      {shadow(c, 22)}
      <Path d="M50 22 C58 30 76 50 74 66 C72 82 60 88 50 88 C40 88 28 82 26 66 C24 50 42 30 50 22 Z" fill={c('#6D3B6E')} />
      <Path d="M50 30 C56 40 64 54 62 72" stroke={c('#8E5590')} strokeWidth={2} fill="none" />
      {stem(c, 'M50 24 L52 14', '#7A9A3A')}
      {shine(c, 40, 52, 4, 10, 15)}
    </G>
  ),
  lime: (c) => (
    <G>
      {shadow(c, 30)}
      <Ellipse cx={50} cy={60} rx={34} ry={26} fill={c('#7CB342')} />
      <Ellipse cx={50} cy={66} rx={30} ry={16} fill={c('#558B2F')} fillOpacity={0.45} />
      <Circle cx={15} cy={60} r={3} fill={c('#689F38')} />
      <Circle cx={85} cy={60} r={3} fill={c('#689F38')} />
      {shine(c, 38, 48, 10, 4)}
    </G>
  ),
  lemon: (c) => (
    <G>
      {shadow(c, 30)}
      <Path d="M12 60 C14 52 22 48 26 44 C36 34 64 34 74 44 C78 48 86 52 88 60 C86 68 78 72 74 76 C64 86 36 86 26 76 C22 72 14 68 12 60 Z" fill={c('#F7D046')} />
      <Ellipse cx={50} cy={68} rx={30} ry={12} fill={c('#E3B321')} fillOpacity={0.5} />
      {shine(c, 38, 48, 10, 4)}
    </G>
  ),
  peach: (c) => (
    <G>
      {shadow(c, 28)}
      {ball(c, 50, 60, 30, '#F6A96B', '#E76F51')}
      <Path d="M50 32 C44 44 44 70 50 88" stroke={c('#E07B52')} strokeWidth={2} fill="none" />
      {leaf(c, 50, 30, -40, '#6BAA45', 0.9)}
    </G>
  ),
  apple: (c) => (
    <G>
      {shadow(c, 28)}
      <Path d="M50 36 C38 26 18 32 18 54 C18 74 34 90 50 84 C66 90 82 74 82 54 C82 32 62 26 50 36 Z" fill={c('#D62828')} />
      <Path d="M24 66 C30 82 44 88 50 84 C56 88 70 82 76 66 C66 76 34 76 24 66 Z" fill={c('#9D1C1C')} fillOpacity={0.5} />
      {stem(c, 'M50 38 C50 30 52 24 56 18')}
      {leaf(c, 54, 26, -30, '#6BAA45', 0.9)}
      {shine(c, 32, 50, 5, 9, 20)}
    </G>
  ),
  avocado: (c) => (
    <G>
      {shadow(c, 26)}
      <Path d="M50 16 C62 16 66 30 70 44 C76 64 72 88 50 88 C28 88 24 64 30 44 C34 30 38 16 50 16 Z" fill={c('#3E6B29')} />
      <Path d="M50 22 C59 22 62 34 65 46 C70 64 66 82 50 82 C34 82 30 64 35 46 C38 34 41 22 50 22 Z" fill={c('#D4E39B')} />
      <Circle cx={50} cy={62} r={13} fill={c('#8B5A2B')} />
      {shine(c, 45, 57, 4, 2)}
    </G>
  ),
  pear: (c) => (
    <G>
      {shadow(c, 26)}
      <Path d="M50 20 C58 20 60 32 62 40 C66 50 78 56 76 70 C74 84 62 90 50 90 C38 90 26 84 24 70 C22 56 34 50 38 40 C40 32 42 20 50 20 Z" fill={c('#C9D649')} />
      <Path d="M28 74 C34 86 66 86 72 74 C62 80 38 80 28 74 Z" fill={c('#A3B232')} fillOpacity={0.6} />
      {stem(c, 'M50 22 L52 12')}
      {shine(c, 40, 56, 4, 9, 20)}
    </G>
  ),
  'bell pepper': (c) => (
    <G>
      {shadow(c, 28)}
      <Path d="M22 44 C22 32 36 30 50 34 C64 30 78 32 78 44 C80 62 74 84 62 86 C58 87 54 82 50 82 C46 82 42 87 38 86 C26 84 20 62 22 44 Z" fill={c('#E63946')} />
      <Path d="M50 36 C46 52 46 70 50 82" stroke={c('#B5202E')} strokeWidth={2.5} fill="none" />
      <Path d="M42 34 C42 26 48 22 50 16 C52 22 58 26 58 34 Z" fill={c('#4E9F3D')} />
      {shine(c, 34, 50, 4, 10, 10)}
    </G>
  ),
  mango: (c) => (
    <G>
      {shadow(c, 28)}
      <Path d="M30 30 C46 18 78 26 80 52 C82 76 62 90 44 86 C26 82 18 62 22 46 C24 38 26 34 30 30 Z" fill={c('#F4A300')} />
      <Path d="M30 30 C40 24 54 22 62 26 C52 30 40 36 30 48 C26 42 26 36 30 30 Z" fill={c('#7CB342')} />
      <Path d="M30 76 C44 90 70 84 78 62 C70 76 50 82 30 76 Z" fill={c('#E85D04')} fillOpacity={0.55} />
      {shine(c, 44, 46, 5, 10, 30)}
    </G>
  ),
  banana: (c) => (
    <G>
      {shadow(c, 32)}
      <Path d="M16 40 C20 70 46 86 74 76 C82 73 86 66 84 62 C64 70 38 62 26 38 C24 34 18 34 16 40 Z" fill={c('#FFD23F')} />
      <Path d="M26 38 C38 62 64 70 84 62 C82 66 80 68 76 70 C56 74 34 64 22 42 Z" fill={c('#E8B923')} fillOpacity={0.6} />
      <Path d="M16 40 L12 36" stroke={c('#6B4F2A')} strokeWidth={4} strokeLinecap="round" />
      <Circle cx={84} cy={62} r={2.5} fill={c('#6B4F2A')} />
    </G>
  ),
  carrot: (c) => (
    <G>
      {shadow(c, 18)}
      <Path d="M38 34 C46 30 58 30 64 36 C60 56 54 76 48 90 C44 76 40 56 38 34 Z" fill={c('#F77F00')} />
      <Path d="M44 46 L52 46 M42 58 L54 58 M46 70 L52 70" stroke={c('#D96A00')} strokeWidth={2} strokeLinecap="round" />
      {leaf(c, 50, 32, -110, '#4E9F3D', 1)}
      {leaf(c, 50, 32, -70, '#5E9E3A', 1)}
      {leaf(c, 50, 32, -90, '#6BAA45', 1.1)}
    </G>
  ),
  papaya: (c) => (
    <G>
      {shadow(c, 30)}
      <Path d="M20 58 C20 40 36 30 54 30 C72 30 82 42 82 58 C82 76 68 86 50 86 C32 86 20 76 20 58 Z" fill={c('#F9A03F')} />
      <Ellipse cx={51} cy={58} rx={24} ry={18} fill={c('#F4845F')} />
      <Ellipse cx={51} cy={58} rx={14} ry={9} fill={c('#3A2E2A')} />
      {seedDots(c, [[44, 56], [50, 54], [56, 56], [47, 61], [54, 61]], '#1E1715', 1.6)}
      <Path d="M24 50 C28 38 40 32 54 32" stroke={c('#8AB17D')} strokeWidth={3} fill="none" strokeLinecap="round" />
    </G>
  ),
  grapefruit: (c) => (
    <G>
      {shadow(c, 30)}
      <Circle cx={50} cy={60} r={32} fill={c('#F6B26B')} />
      <Circle cx={50} cy={60} r={27} fill={c('#FCE4D6')} />
      {Array.from({ length: 8 }, (_, i) => (
        <Path key={i} d="M50 60 L50 37 A23 23 0 0 1 66.3 43.7 Z" fill={c('#F28482')} transform={`rotate(${i * 45} 50 60)`} />
      ))}
      <Circle cx={50} cy={60} r={3} fill={c('#FCE4D6')} />
    </G>
  ),
  'ear of corn': (c) => (
    <G>
      {shadow(c, 20)}
      <Path d="M36 30 C36 20 64 20 64 30 L62 80 C62 88 38 88 38 80 Z" fill={c('#FFD23F')} />
      {Array.from({ length: 7 }, (_, r) =>
        Array.from({ length: 4 }, (_, k) => <Circle key={`${r}-${k}`} cx={42 + k * 5.5} cy={30 + r * 7.5} r={2.3} fill={c('#F4B400')} />),
      )}
      <Path d="M38 84 C30 70 26 50 30 40 C34 56 40 70 46 88 Z" fill={c('#7CB342')} />
      <Path d="M62 84 C70 70 74 50 70 40 C66 56 60 70 54 88 Z" fill={c('#689F38')} />
    </G>
  ),
  cauliflower: (c) => (
    <G>
      {shadow(c, 32)}
      {leaf(c, 50, 74, 160, '#6BAA45', 1.4)}
      {leaf(c, 50, 74, 20, '#5E9E3A', 1.4)}
      {(
        [
          [38, 48, 14], [52, 42, 15], [64, 52, 13], [44, 60, 14], [58, 62, 13], [32, 60, 10], [70, 64, 9],
        ] as const
      ).map(([x, y, r], i) => (
        <Circle key={i} cx={x} cy={y} r={r} fill={c(i % 2 ? '#F2ECD8' : '#FBF7EA')} stroke={c('#DCD0AE')} strokeWidth={1.5} />
      ))}
    </G>
  ),
  'head of lettuce': (c) => (
    <G>
      {shadow(c, 32)}
      <Circle cx={50} cy={60} r={32} fill={c('#7CB342')} />
      <Path d="M22 56 C30 40 44 34 50 46 C56 34 70 40 78 56 C70 52 60 54 50 64 C40 54 30 52 22 56 Z" fill={c('#9BC53D')} />
      <Path d="M30 72 C38 60 46 62 50 70 C54 62 62 60 70 72" stroke={c('#C5DE7A')} strokeWidth={3} fill="none" strokeLinecap="round" />
      {shine(c, 38, 44, 7, 3)}
    </G>
  ),
  'head of broccoli': (c) => (
    <G>
      {shadow(c, 26)}
      <Path d="M42 60 L40 88 L60 88 L58 60 Z" fill={c('#8DB580')} />
      {(
        [
          [36, 46, 13], [50, 38, 14], [64, 46, 13], [42, 58, 12], [58, 58, 12], [28, 56, 9], [72, 56, 9],
        ] as const
      ).map(([x, y, r], i) => (
        <Circle key={i} cx={x} cy={y} r={r} fill={c(i % 2 ? '#3F7D20' : '#4A8F2A')} />
      ))}
    </G>
  ),
  eggplant: (c) => (
    <G>
      {shadow(c, 30)}
      <Path d="M30 30 C44 26 52 40 64 50 C80 62 84 82 70 88 C56 94 36 82 30 62 C26 50 24 36 30 30 Z" fill={c('#5E2B7E')} />
      <Path d="M24 36 C28 24 40 22 46 30 C40 30 34 36 30 42 Z" fill={c('#4E9F3D')} />
      {stem(c, 'M28 30 L20 22', '#4E9F3D', 4)}
      {shine(c, 42, 50, 4, 12, -40)}
    </G>
  ),
  'butternut squash': (c) => (
    <G>
      {shadow(c, 24)}
      <Path d="M42 18 C56 18 58 30 58 42 C58 50 74 56 74 72 C74 86 62 92 50 92 C38 92 26 86 26 72 C26 56 42 50 42 42 C42 30 40 18 42 18 Z" fill={c('#E9C46A')} />
      <Path d="M30 78 C36 90 64 90 70 78 C62 84 38 84 30 78 Z" fill={c('#D4A537')} fillOpacity={0.6} />
      {stem(c, 'M47 18 L48 10', '#7A6230', 5)}
      {shine(c, 40, 64, 4, 9, 15)}
    </G>
  ),
  cabbage: (c) => (
    <G>
      {shadow(c, 32)}
      <Circle cx={50} cy={58} r={32} fill={c('#A7C957')} />
      <Circle cx={50} cy={56} r={22} fill={c('#C7DE8A')} />
      <Path d="M50 34 L50 78 M50 52 L34 40 M50 52 L66 40 M50 64 L32 58 M50 64 L68 58" stroke={c('#E4EFC2')} strokeWidth={2} strokeLinecap="round" />
    </G>
  ),
  coconut: (c) => (
    <G>
      {shadow(c, 30)}
      <Circle cx={50} cy={58} r={32} fill={c('#7F5539')} />
      <Path d="M30 40 L36 44 M60 30 L62 36 M70 48 L76 50 M34 66 L28 70 M54 80 L56 86" stroke={c('#5C3D29')} strokeWidth={2} strokeLinecap="round" />
      <Circle cx={44} cy={42} r={3} fill={c('#3E2A1C')} />
      <Circle cx={54} cy={42} r={3} fill={c('#3E2A1C')} />
      <Circle cx={49} cy={50} r={3} fill={c('#3E2A1C')} />
      {shine(c, 36, 46, 6, 3)}
    </G>
  ),
  squash: (c) => (
    <G>
      {shadow(c, 30)}
      <Path d="M50 26 C68 22 84 38 82 58 C80 78 64 90 50 90 C36 90 20 78 18 58 C16 38 32 22 50 26 Z" fill={c('#386641')} />
      <Path d="M50 28 C46 48 46 72 50 88 M34 34 C30 52 32 72 38 84 M66 34 C70 52 68 72 62 84" stroke={c('#2C4F32')} strokeWidth={2.5} fill="none" />
      <Ellipse cx={64} cy={70} rx={8} ry={5} fill={c('#F4A259')} />
      {stem(c, 'M50 26 L52 16', '#7A6230', 5)}
    </G>
  ),
  pineapple: (c) => (
    <G>
      {shadow(c, 24)}
      <Ellipse cx={50} cy={66} rx={22} ry={26} fill={c('#F4A259')} />
      <Path d="M32 52 L68 80 M28 66 L60 90 M40 44 L72 68 M68 52 L32 80 M72 66 L40 90 M60 44 L28 68" stroke={c('#D9822B')} strokeWidth={2} />
      <Path d="M50 42 L40 20 L48 30 L50 12 L52 30 L60 20 Z" fill={c('#4E9F3D')} />
      <Path d="M50 42 L34 28 L46 36 M50 42 L66 28 L54 36" stroke={c('#5E9E3A')} strokeWidth={4} strokeLinecap="round" fill="none" />
    </G>
  ),
  cantaloupe: (c) => (
    <G>
      {shadow(c, 32)}
      <Circle cx={46} cy={58} r={32} fill={c('#E9D8A6')} />
      <Path d="M22 46 L70 70 M20 62 L60 84 M30 32 L76 56 M24 72 L66 38 M36 86 L74 54 M20 54 L52 28" stroke={c('#C9B27C')} strokeWidth={1.5} />
      <Path d="M58 60 L88 60 A30 30 0 0 1 64 88 Z" fill={c('#F4A261')} />
      <Path d="M62 62 L82 62 A20 20 0 0 1 66 80 Z" fill={c('#F7B98B')} />
    </G>
  ),
  'honeydew melon': (c) => (
    <G>
      {shadow(c, 32)}
      {ball(c, 50, 58, 32, '#D4E09B', '#AFC16B')}
      <Path d="M34 44 C38 46 40 50 38 54 M58 36 C60 40 64 42 66 40 M62 70 C64 66 70 66 72 68" stroke={c('#B9CB7E')} strokeWidth={1.5} fill="none" />
    </G>
  ),
  'head of romaine lettuce': (c) => (
    <G>
      {shadow(c, 24)}
      {(
        [
          [-20, '#6A994E'], [20, '#6A994E'], [-8, '#8DB55A'], [8, '#8DB55A'], [0, '#A7C957'],
        ] as const
      ).map(([rot, color], i) => (
        <G key={i} transform={`rotate(${rot} 50 90)`}>
          <Path d="M50 90 C36 80 34 40 42 22 C46 14 54 14 58 22 C66 40 64 80 50 90 Z" fill={c(color)} />
          <Path d="M50 88 L50 26" stroke={c('#E4EFC2')} strokeWidth={2.5} strokeLinecap="round" />
        </G>
      ))}
    </G>
  ),
  'bunch of Swiss chard': (c) => (
    <G>
      {shadow(c, 22)}
      {(
        [
          [-16, '#3F7D20'], [0, '#4A8F2A'], [16, '#3F7D20'],
        ] as const
      ).map(([rot, color], i) => (
        <G key={i} transform={`rotate(${rot} 50 88)`}>
          <Path d="M50 88 L50 46" stroke={c('#D62828')} strokeWidth={4} strokeLinecap="round" />
          <Path d="M50 58 C34 52 34 24 50 14 C66 24 66 52 50 58 Z" fill={c(color)} />
          <Path d="M50 56 L50 20" stroke={c('#D62828')} strokeWidth={1.5} />
        </G>
      ))}
    </G>
  ),
  leek: (c) => (
    <G>
      {shadow(c, 18)}
      <Rect x={42} y={50} width={16} height={40} rx={8} fill={c('#F3F4E6')} />
      <Path d="M44 90 C46 92 54 92 56 90" stroke={c('#C9C2A6')} strokeWidth={3} strokeLinecap="round" fill="none" />
      <Path d="M42 56 C38 36 30 20 22 12 C34 20 44 34 50 52 Z" fill={c('#4E9F3D')} />
      <Path d="M58 56 C62 36 70 20 78 12 C66 20 56 34 50 52 Z" fill={c('#3F7D20')} />
      <Path d="M46 54 C46 34 48 20 50 10 C52 20 54 34 54 54 Z" fill={c('#7CB342')} />
    </G>
  ),
  'mini watermelon': (c) => (
    <G>
      {shadow(c, 30)}
      <Circle cx={50} cy={58} r={30} fill={c('#5E9E3A')} />
      {[-18, -6, 6, 18].map((dx, i) => (
        <Path key={i} d={`M${50 + dx} 30 C${50 + dx * 1.6} 46 ${50 + dx * 1.6} 70 ${50 + dx} 86`} stroke={c('#2F6B2A')} strokeWidth={4} fill="none" />
      ))}
      {shine(c, 38, 44, 7, 3)}
    </G>
  ),
  'small pumpkin': (c) => (
    <G>
      {shadow(c, 34)}
      <Ellipse cx={36} cy={62} rx={18} ry={24} fill={c('#E8720C')} />
      <Ellipse cx={64} cy={62} rx={18} ry={24} fill={c('#E8720C')} />
      <Ellipse cx={50} cy={62} rx={18} ry={26} fill={c('#F77F00')} />
      <Path d="M50 38 C48 30 52 24 56 20" stroke={c('#6B8E23')} strokeWidth={5} strokeLinecap="round" fill="none" />
      {shine(c, 44, 50, 4, 9, 10)}
    </G>
  ),
  watermelon: (c) => (
    <G>
      {shadow(c, 38)}
      <Ellipse cx={50} cy={58} rx={40} ry={28} fill={c('#5E9E3A')} />
      {[-24, -10, 4, 18].map((dy, i) => (
        <Path key={i} d={`M12 ${58 + dy * 0.5} C34 ${50 + dy} 66 ${50 + dy} 88 ${58 + dy * 0.5}`} stroke={c('#2F6B2A')} strokeWidth={4} fill="none" />
      ))}
      {shine(c, 32, 44, 9, 3, -10)}
    </G>
  ),
};

/** The drawing for a size name, or null when none exists (the caller falls back to the week number). */
export const drawingFor = (size: string) => DRAWINGS[size] ?? null;
