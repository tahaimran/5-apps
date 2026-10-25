import type { ReactNode } from 'react';
import { Circle, Ellipse, G, Path, Rect } from 'react-native-svg';

/**
 * Hand-drawn pictures for the word packs, on a 100×100 canvas, in one calm flat style: a shape, a few
 * darker details, a soft white highlight and a ground shadow. Adult and warm (a curled-up cat, a robin,
 * a cottage), never cartoon faces. Every color goes through `c()` so high contrast can recolor the set.
 */
export type Tone = (hex: string) => string;

const channel = (hex: string, i: number) => parseInt(hex.replace('#', '').slice(i * 2, i * 2 + 2), 16);
const hex2 = (n: number) => Math.round(Math.max(0, Math.min(255, n))).toString(16).padStart(2, '0').toUpperCase();

/**
 * High contrast is black, white and yellow (plan §7.1): each color becomes a yellow of the same
 * lightness on black, from a deep olive for the darkest ink to full yellow for the palest paper, so the
 * drawing keeps its shapes without any other hue.
 */
export const contrastTone: Tone = (hex) => {
  const lum = (0.299 * channel(hex, 0) + 0.587 * channel(hex, 1) + 0.114 * channel(hex, 2)) / 255;
  const v = 100 + lum * 155;
  return `#${hex2(v)}${hex2(v)}00`;
};

const shadow = (c: Tone, w = 32) => <Ellipse cx={50} cy={93} rx={w} ry={4} fill={c('#13233F')} fillOpacity={0.14} />;
const shine = (c: Tone, cx: number, cy: number, rx: number, ry: number, rot = -30) => (
  <Ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill={c('#FFFFFF')} fillOpacity={0.42} transform={`rotate(${rot} ${cx} ${cy})`} />
);
const leaf = (c: Tone, x: number, y: number, rot: number, color = '#6FA35A', s = 1) => (
  <Path d="M0 0 C6 -9 17 -9 22 0 C17 9 6 9 0 0 Z" fill={c(color)} transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`} />
);

export const PACK_DRAWINGS: Record<string, (c: Tone) => ReactNode> = {
  // A ginger cat curled up, eyes closed.
  animals: (c) => (
    <G>
      {shadow(c, 30)}
      <Path d="M70 82 C88 80 90 62 80 58" stroke={c('#E39A4F')} strokeWidth={7} strokeLinecap="round" fill="none" />
      <Path d="M30 91 C25 68 35 51 50 51 C65 51 75 68 70 91 Z" fill={c('#E39A4F')} />
      <Ellipse cx={50} cy={77} rx={11} ry={13} fill={c('#F7E4C6')} />
      <Path d="M35 31 L37 15 L47 25 Z M65 31 L63 15 L53 25 Z" fill={c('#E39A4F')} />
      <Path d="M38 27 L39 19 L44 24 Z M62 27 L61 19 L56 24 Z" fill={c('#E8A2A0')} />
      <Circle cx={50} cy={39} r={18} fill={c('#E39A4F')} />
      <Path d="M47 22 L48 29 M53 22 L52 29 M33 63 L39 61 M67 63 L61 61" stroke={c('#C2742F')} strokeWidth={2.5} strokeLinecap="round" />
      <Path d="M40 40 Q43.5 43.5 47 40 M53 40 Q56.5 43.5 60 40" stroke={c('#5A3A22')} strokeWidth={2.4} strokeLinecap="round" fill="none" />
      <Path d="M47.5 46 L52.5 46 L50 49 Z" fill={c('#D97E86')} />
      <Ellipse cx={42} cy={90} rx={6} ry={3.5} fill={c('#F7E4C6')} />
      <Ellipse cx={58} cy={90} rx={6} ry={3.5} fill={c('#F7E4C6')} />
      {shine(c, 43, 31, 6, 3)}
    </G>
  ),
  // A robin on a branch.
  birds: (c) => (
    <G>
      {shadow(c, 26)}
      <Path d="M10 80 C30 76 60 74 92 66" stroke={c('#8A5A3B')} strokeWidth={5} strokeLinecap="round" fill="none" />
      {leaf(c, 74, 70, -60, '#6FA35A', 0.8)}
      {leaf(c, 18, 79, 160, '#86B86C', 0.7)}
      <Path d="M66 54 L88 40 L84 56 Z" fill={c('#6E5646')} />
      <Ellipse cx={52} cy={57} rx={22} ry={17} fill={c('#8A6E5A')} />
      <Ellipse cx={44} cy={62} rx={14} ry={12} fill={c('#E5793B')} />
      <Path d="M52 50 C62 48 70 54 68 62 C62 60 56 58 52 50 Z" fill={c('#6E5646')} />
      <Circle cx={36} cy={44} r={12} fill={c('#8A6E5A')} />
      <Path d="M30 48 C34 54 42 54 44 50 C40 50 34 50 30 48 Z" fill={c('#E5793B')} />
      <Path d="M24 44 L16 46 L24 48 Z" fill={c('#E8B04A')} />
      <Circle cx={32} cy={42} r={2.2} fill={c('#1E1A17')} />
      <Path d="M46 73 L44 78 M54 73 L55 77" stroke={c('#6E5646')} strokeWidth={2} strokeLinecap="round" />
      {shine(c, 36, 38, 4, 2)}
      {shine(c, 50, 50, 7, 3, -10)}
    </G>
  ),
  // A bowl of fruit: apple, pear, lemon and grapes.
  food: (c) => (
    <G>
      {shadow(c, 34)}
      <Ellipse cx={66} cy={47} rx={10} ry={8} fill={c('#F2CB4C')} />
      <Path d="M58 30 C66 32 68 42 64 50 C60 56 50 56 47 50 C44 44 50 38 52 32 C53 28 55 28 58 30 Z" fill={c('#A8C256')} />
      <Path d="M56 30 L58 22" stroke={c('#7A5230')} strokeWidth={2.5} strokeLinecap="round" />
      <Circle cx={36} cy={46} r={13} fill={c('#D94F3D')} />
      <Path d="M36 33 L37 27" stroke={c('#7A5230')} strokeWidth={2.5} strokeLinecap="round" />
      {leaf(c, 38, 29, -20, '#6FA35A', 0.55)}
      {[[24, 54], [30, 58], [22, 60], [28, 64]].map(([x, y], i) => (
        <Circle key={i} cx={x} cy={y} r={4.5} fill={c('#7A5C8E')} />
      ))}
      <Path d="M14 56 L86 56 C86 76 70 88 50 88 C30 88 14 76 14 56 Z" fill={c('#3F8C8C')} />
      <Rect x={12} y={53} width={76} height={7} rx={3.5} fill={c('#5BA8A6')} />
      <Path d="M24 68 C34 74 66 74 76 68" stroke={c('#2E6B6B')} strokeWidth={2.5} strokeLinecap="round" fill="none" />
      {shine(c, 31, 41, 4, 2.5)}
      {shine(c, 54, 38, 3, 6, 10)}
    </G>
  ),
  // A lattice pie, still warm.
  baking: (c) => (
    <G>
      {shadow(c, 38)}
      <Path d="M40 26 C36 20 44 16 40 10 M52 26 C48 20 56 16 52 10 M64 26 C60 20 68 16 64 10" stroke={c('#B9C7D6')} strokeWidth={3} strokeLinecap="round" fill="none" />
      <Path d="M12 60 L20 80 C24 86 76 86 80 80 L88 60 Z" fill={c('#C9763C')} />
      <Ellipse cx={50} cy={58} rx={38} ry={16} fill={c('#E8B97A')} />
      <Ellipse cx={50} cy={57} rx={31} ry={11} fill={c('#8E3B4F')} />
      {[-18, -6, 6, 18].map((dx, i) => (
        <Path key={`v${i}`} d={`M${50 + dx} 47 L${50 + dx} 67`} stroke={c('#F0C98E')} strokeWidth={4} strokeLinecap="round" />
      ))}
      {[52, 58, 63].map((y, i) => (
        <Path key={`h${i}`} d={`M${24 + i * 2} ${y} L${76 - i * 2} ${y}`} stroke={c('#F0C98E')} strokeWidth={4} strokeLinecap="round" />
      ))}
      <Path d="M12 60 C20 66 30 70 50 71 C70 70 80 66 88 60" stroke={c('#A65F2D')} strokeWidth={2.5} fill="none" />
      {shine(c, 30, 51, 5, 2, -10)}
    </G>
  ),
  // A vintage suitcase with two travel stickers.
  travel: (c) => (
    <G>
      {shadow(c, 36)}
      <Path d="M38 30 L38 22 C38 18 62 18 62 22 L62 30" stroke={c('#6B4429')} strokeWidth={5} fill="none" strokeLinecap="round" />
      <Rect x={14} y={30} width={72} height={56} rx={10} fill={c('#C8643B')} />
      <Rect x={14} y={30} width={72} height={10} rx={5} fill={c('#D9794E')} />
      <Rect x={28} y={30} width={7} height={56} fill={c('#8A5A3B')} />
      <Rect x={65} y={30} width={7} height={56} fill={c('#8A5A3B')} />
      <Rect x={26} y={52} width={11} height={8} rx={2} fill={c('#E8B04A')} />
      <Rect x={63} y={52} width={11} height={8} rx={2} fill={c('#E8B04A')} />
      <Circle cx={50} cy={50} r={8} fill={c('#8FC8E8')} />
      <Path d="M44 50 L56 50 M50 44 C46 48 46 52 50 56 M50 44 C54 48 54 52 50 56" stroke={c('#2F6F96')} strokeWidth={1.6} fill="none" />
      <Rect x={41} y={66} width={18} height={11} rx={3} fill={c('#F6EBD4')} transform="rotate(-8 50 71)" />
      <Path d="M44 72 L56 70" stroke={c('#C8643B')} strokeWidth={2} strokeLinecap="round" />
      {shine(c, 22, 36, 5, 2, 0)}
    </G>
  ),
  // Three buildings against a low sun.
  cities: (c) => (
    <G>
      {shadow(c, 40)}
      <Circle cx={70} cy={32} r={14} fill={c('#F2CB4C')} />
      <Rect x={12} y={44} width={22} height={46} rx={2} fill={c('#5B6F8C')} />
      <Rect x={36} y={22} width={26} height={68} rx={2} fill={c('#2F4A6B')} />
      <Path d="M49 10 L49 22" stroke={c('#2F4A6B')} strokeWidth={2.5} />
      <Rect x={64} y={52} width={24} height={38} rx={2} fill={c('#3F8C8C')} />
      {[0, 1, 2, 3, 4, 5].map((r) =>
        [0, 1, 2].map((col) => <Rect key={`m${r}${col}`} x={40 + col * 7} y={28 + r * 9} width={4} height={5} rx={1} fill={c('#F6EBD4')} fillOpacity={(r + col) % 3 === 0 ? 0.35 : 0.95} />),
      )}
      {[0, 1, 2, 3].map((r) => [0, 1].map((col) => <Rect key={`l${r}${col}`} x={17 + col * 8} y={50 + r * 9} width={4} height={5} rx={1} fill={c('#F6EBD4')} fillOpacity={0.9} />))}
      {[0, 1, 2].map((r) => [0, 1].map((col) => <Rect key={`r${r}${col}`} x={69 + col * 8} y={58 + r * 9} width={5} height={5} rx={1} fill={c('#F6EBD4')} fillOpacity={0.9} />))}
      {shine(c, 64, 27, 4, 2.5)}
    </G>
  ),
  // A snow-capped mountain with pines and a sun.
  nature: (c) => (
    <G>
      {shadow(c, 42)}
      <Circle cx={74} cy={24} r={10} fill={c('#F2CB4C')} />
      <Path d="M8 88 L44 22 L80 88 Z" fill={c('#7D9AA8')} />
      <Path d="M44 22 L56 44 L49 40 L44 46 L38 40 L32 44 Z" fill={c('#FFFFFF')} />
      <Path d="M44 22 L80 88 L60 88 Z" fill={c('#62808F')} />
      <Path d="M52 88 L74 52 L96 88 Z" fill={c('#9DB5A0')} />
      {[
        [18, 66, 1],
        [30, 72, 0.8],
        [70, 70, 0.9],
      ].map(([x, y, s], i) => (
        <G key={i} transform={`translate(${x} ${y}) scale(${s})`}>
          <Rect x={-2} y={14} width={4} height={8} fill={c('#7A5230')} />
          <Path d="M0 -12 L11 6 L-11 6 Z M0 -4 L13 15 L-13 15 Z" fill={c('#3E7A4E')} />
        </G>
      ))}
      {shine(c, 40, 32, 3, 6, 25)}
    </G>
  ),
  // A wrapped gift with a soft bow.
  holidays: (c) => (
    <G>
      {shadow(c, 34)}
      <Rect x={20} y={46} width={60} height={42} rx={4} fill={c('#3F8C8C')} />
      <Rect x={16} y={36} width={68} height={14} rx={4} fill={c('#4FA3A2')} />
      <Rect x={45} y={36} width={10} height={52} fill={c('#E8B04A')} />
      <Path d="M50 36 C38 20 24 26 32 34 C36 38 46 37 50 36 Z" fill={c('#E5793B')} />
      <Path d="M50 36 C62 20 76 26 68 34 C64 38 54 37 50 36 Z" fill={c('#E5793B')} />
      <Circle cx={50} cy={36} r={5} fill={c('#D0632A')} />
      {shine(c, 26, 41, 5, 2, 0)}
    </G>
  ),
  // One tree through the year: blossom, summer, autumn and frost in four quarters.
  seasons: (c) => (
    <G>
      {shadow(c, 28)}
      <Path d="M46 90 L47 62 C44 56 38 54 34 52 M47 66 C52 60 58 58 62 56 M53 90 L52 60" stroke={c('#8A5A3B')} strokeWidth={6} strokeLinecap="round" fill="none" />
      <Path d="M50 44 L50 10 A34 34 0 0 0 16 44 Z" fill={c('#F2A7B6')} />
      <Path d="M50 44 L84 44 A34 34 0 0 0 50 10 Z" fill={c('#7DB46C')} />
      <Path d="M50 44 L50 78 A34 34 0 0 0 84 44 Z" fill={c('#E08A3C')} />
      <Path d="M50 44 L16 44 A34 34 0 0 0 50 78 Z" fill={c('#CFE3EE')} />
      <Path d="M50 10 L50 78 M16 44 L84 44" stroke={c('#FFFFFF')} strokeWidth={2} strokeOpacity={0.7} />
      {[[30, 26], [38, 20], [24, 36]].map(([x, y], i) => <Circle key={`b${i}`} cx={x} cy={y} r={2.2} fill={c('#FFFFFF')} />)}
      {[[28, 54], [36, 64], [24, 62]].map(([x, y], i) => <Circle key={`s${i}`} cx={x} cy={y} r={1.8} fill={c('#FFFFFF')} />)}
      {leaf(c, 84, 74, 40, '#E08A3C', 0.5)}
      {shine(c, 62, 22, 6, 3)}
    </G>
  ),
  // A ball of yarn with two knitting needles.
  hobbies: (c) => (
    <G>
      {shadow(c, 30)}
      <Path d="M70 76 C82 80 88 70 94 74" stroke={c('#8E5C9E')} strokeWidth={3} strokeLinecap="round" fill="none" />
      <Path d="M22 22 L74 82 M78 20 L30 84" stroke={c('#C9A06A')} strokeWidth={4} strokeLinecap="round" />
      <Circle cx={22} cy={22} r={5} fill={c('#E5793B')} />
      <Circle cx={78} cy={20} r={5} fill={c('#E5793B')} />
      <Circle cx={50} cy={58} r={28} fill={c('#8E5C9E')} />
      <Path d="M26 50 C38 42 62 44 74 56 M24 62 C40 54 62 58 76 68 M34 78 C44 66 60 64 70 76 M40 32 C52 42 54 60 48 84" stroke={c('#B487C2')} strokeWidth={3} fill="none" strokeLinecap="round" />
      {shine(c, 40, 44, 7, 3.5)}
    </G>
  ),
  // A record and two notes.
  music: (c) => (
    <G>
      {shadow(c, 32)}
      <Circle cx={44} cy={58} r={32} fill={c('#26303F')} />
      {[26, 20, 14].map((r) => (
        <Circle key={r} cx={44} cy={58} r={r} stroke={c('#3C4A5E')} strokeWidth={1.5} fill="none" />
      ))}
      <Circle cx={44} cy={58} r={10} fill={c('#E8B04A')} />
      <Circle cx={44} cy={58} r={2.4} fill={c('#26303F')} />
      <Path d="M30 38 A24 24 0 0 1 52 34" stroke={c('#FFFFFF')} strokeWidth={3} strokeOpacity={0.35} fill="none" strokeLinecap="round" />
      <Path d="M70 20 L88 15 L88 42 M70 20 L70 46" stroke={c('#C8643B')} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <Path d="M70 20 L88 15 L88 22 L70 27 Z" fill={c('#C8643B')} />
      <Ellipse cx={65} cy={47} rx={6} ry={4.5} fill={c('#C8643B')} transform="rotate(-20 65 47)" />
      <Ellipse cx={83} cy={43} rx={6} ry={4.5} fill={c('#C8643B')} transform="rotate(-20 83 43)" />
    </G>
  ),
  // A cottage with a smoking chimney and a bush.
  home: (c) => (
    <G>
      {shadow(c, 40)}
      <Circle cx={70} cy={14} r={4} fill={c('#D7DEE6')} />
      <Circle cx={75} cy={8} r={5} fill={c('#E4E9EE')} />
      <Rect x={64} y={20} width={10} height={20} fill={c('#8A5A3B')} />
      <Rect x={20} y={48} width={60} height={40} rx={2} fill={c('#F6E3C4')} />
      <Path d="M12 52 L50 20 L88 52 Z" fill={c('#C8643B')} />
      <Path d="M12 52 L50 20 L56 25 L22 54 Z" fill={c('#D9794E')} />
      <Rect x={44} y={62} width={14} height={26} rx={7} fill={c('#3F8C8C')} />
      <Circle cx={54} cy={76} r={1.6} fill={c('#E8B04A')} />
      <Rect x={26} y={60} width={12} height={12} rx={2} fill={c('#8FC8E8')} stroke={c('#FFFFFF')} strokeWidth={2} />
      <Rect x={64} y={60} width={12} height={12} rx={2} fill={c('#8FC8E8')} stroke={c('#FFFFFF')} strokeWidth={2} />
      <Path d="M32 60 L32 72 M26 66 L38 66 M70 60 L70 72 M64 66 L76 66" stroke={c('#FFFFFF')} strokeWidth={1.5} />
      <Circle cx={16} cy={84} r={8} fill={c('#6FA35A')} />
      <Circle cx={24} cy={86} r={6} fill={c('#86B86C')} />
      <Circle cx={86} cy={85} r={7} fill={c('#86B86C')} />
      {shine(c, 30, 64, 2, 3, 0)}
    </G>
  ),
};

/** A letter drawn with strokes (no font inside an SVG), centered at 0,0 in a 20-unit box. */
const glyph = (letter: 'A' | 'B' | 'C', stroke: string, w = 3.4) => {
  const d = { A: 'M-7 9 L0 -9 L7 9 M-4 3 L4 3', B: 'M-6 -9 L-6 9 L2 9 C9 9 9 0 2 0 L-6 0 M-6 -9 L1 -9 C7 -9 7 0 1 0', C: 'M7 -6 C3 -11 -8 -10 -8 0 C-8 10 3 11 7 6' }[letter];
  return <Path d={d} stroke={stroke} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" fill="none" />;
};

/** Pictures for screens rather than packs: the onboarding welcome and the Daily card. */
export const SCENE_DRAWINGS: Record<'welcome' | 'calendar', (c: Tone) => ReactNode> = {
  // Big letter tiles under a gold magnifying glass (plan §6 screen 1).
  welcome: (c) => (
    <G>
      {shadow(c, 38)}
      {([['A', 20, 72], ['C', 82, 26]] as const).map(([l, x, y]) => (
        <G key={l} transform={`translate(${x} ${y})`}>
          <Rect x={-12} y={-12} width={24} height={24} rx={6} fill={c('#FFF9EC')} stroke={c('#E3D6BC')} strokeWidth={2} />
          {glyph(l, c('#13233F'))}
        </G>
      ))}
      <G transform="translate(48 48)">
        <Path d="M18 18 L32 32" stroke={c('#C98A00')} strokeWidth={9} strokeLinecap="round" />
        <Circle cx={0} cy={0} r={24} fill={c('#FFAE94')} stroke={c('#FFC93C')} strokeWidth={7} />
        <G transform="scale(1.45)">{glyph('B', c('#13233F'), 3)}</G>
        {shine(c, -10, -11, 7, 3)}
      </G>
    </G>
  ),
  // A calendar page with today ticked.
  calendar: (c) => (
    <G>
      {shadow(c, 34)}
      <Rect x={16} y={20} width={68} height={68} rx={10} fill={c('#FFFFFF')} />
      <Path d="M16 30 C16 24 20 20 26 20 L74 20 C80 20 84 24 84 30 L84 38 L16 38 Z" fill={c('#1F5FAF')} />
      <Rect x={30} y={12} width={6} height={16} rx={3} fill={c('#FFC93C')} />
      <Rect x={64} y={12} width={6} height={16} rx={3} fill={c('#FFC93C')} />
      {[0, 1, 2].map((r) =>
        [0, 1, 2, 3].map((col) => <Rect key={`${r}${col}`} x={25 + col * 14} y={46 + r * 12} width={8} height={6} rx={2} fill={c('#C8D6E5')} />),
      )}
      <Circle cx={63} cy={70} r={11} fill={c('#6CBF3A')} />
      <Path d="M57.5 70 L61.5 74 L68.5 66" stroke={c('#FFFFFF')} strokeWidth={3.2} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      {shine(c, 26, 25, 5, 2, 0)}
    </G>
  ),
};

/** A soft tile color behind each picture on light screens (the pack's own color). */
export const PACK_TINTS: Record<string, string> = {
  animals: '#FCEBD9',
  birds: '#FBE6DA',
  food: '#E3F2EE',
  baking: '#F8E8DC',
  travel: '#FBE7DF',
  cities: '#E2EAF3',
  nature: '#E5F0E3',
  holidays: '#E2F1F0',
  seasons: '#F7E9EF',
  hobbies: '#EFE6F3',
  music: '#ECEEF2',
  home: '#FBEEDC',
};

export const drawingFor = (packId: string) => PACK_DRAWINGS[packId] ?? null;
