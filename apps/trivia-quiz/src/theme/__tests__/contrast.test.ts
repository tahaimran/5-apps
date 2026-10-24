// insetTones lives in the UI kit, which loads Reanimated: the stand-ins come first.
import '@/testing/mocks';
import { insetTones } from '@shared/ui';
import { defaultPalettes } from '@shared/theme/tokens';
import { CATEGORIES } from '@/domain/categories';
import { blend, categoryTone } from '@/ui/categoryTone';
import { contrastRatio, luminance } from '../contrast';
import { DISPLAY_STYLES, extraColors, FROST, palette, scaledType, TEXT_SCALES } from '../tokens';

type Mode = 'light' | 'dark';
const modes: Mode[] = ['light', 'dark'];
const merged = (mode: Mode) => ({ ...defaultPalettes[mode], ...palette[mode] });
const AA = 4.5;
const NON_TEXT = 3;

describe('contrast helpers', () => {
  it('matches known ratios', () => {
    expect(contrastRatio('#000000', '#FFFFFF')).toBeCloseTo(21, 0);
    expect(contrastRatio('#777777', '#777777')).toBeCloseTo(1, 5);
  });
  it('blends a color over another', () => {
    expect(blend('#FFFFFF', '#000000', 0.5)).toBe('#808080');
  });
});

describe.each(modes)('%s palette (plan §7: text pairs at least 4.5:1)', (mode) => {
  const c = merged(mode);
  const x = extraColors[mode];
  it.each([
    ['text', 'background'],
    ['text', 'surface'],
    ['text', 'surfaceAlt'],
    ['textMuted', 'background'],
    ['textMuted', 'surface'],
    ['textMuted', 'surfaceAlt'],
    ['primary', 'background'],
    ['primary', 'surface'],
    ['primary', 'primarySoft'],
    ['accent', 'surface'],
    ['accent', 'background'],
    ['success', 'surface'],
    ['danger', 'surface'],
    ['success', 'background'],
    ['danger', 'background'],
  ] as const)('%s on %s', (fg, bg) => {
    expect(contrastRatio(c[fg], c[bg])).toBeGreaterThanOrEqual(AA);
  });

  it('keeps the "Did you know?" label readable on the fact panel', () => {
    const panel = mode === 'light' ? c.background : c.surfaceAlt;
    expect(contrastRatio(c.accent, panel)).toBeGreaterThanOrEqual(AA);
    expect(contrastRatio(c.text, panel)).toBeGreaterThanOrEqual(AA);
  });

  it('keeps button labels readable on the primary, gold, correct and wrong fills', () => {
    expect(contrastRatio(c.onPrimary, c.primary)).toBeGreaterThanOrEqual(AA);
    expect(contrastRatio(x.onGold, x.gold)).toBeGreaterThanOrEqual(AA);
    expect(contrastRatio(x.onFill, x.correct)).toBeGreaterThanOrEqual(AA);
    expect(contrastRatio(x.onFill, x.wrong)).toBeGreaterThanOrEqual(AA);
  });

  it('keeps body text readable on every soft tint (chips, notes, icon rows)', () => {
    for (const tint of [c.primarySoft, x.goldSoft, x.successSoft, x.dangerSoft, x.streakSoft]) {
      expect(contrastRatio(c.text, tint)).toBeGreaterThanOrEqual(AA);
    }
  });

  it('keeps icons visible on their soft circles (3:1 non-text contrast)', () => {
    expect(contrastRatio(c.primary, c.primarySoft)).toBeGreaterThanOrEqual(NON_TEXT);
    expect(contrastRatio(c.accent, x.goldSoft)).toBeGreaterThanOrEqual(NON_TEXT);
    expect(contrastRatio(c.success, x.successSoft)).toBeGreaterThanOrEqual(NON_TEXT);
    expect(contrastRatio(c.danger, x.dangerSoft)).toBeGreaterThanOrEqual(NON_TEXT);
    expect(contrastRatio(x.streak, x.streakSoft)).toBeGreaterThanOrEqual(NON_TEXT);
    expect(contrastRatio(x.streak, c.surface)).toBeGreaterThanOrEqual(NON_TEXT);
  });

  it('keeps the answer pills readable: the text, and the letter on its badge', () => {
    expect(contrastRatio(x.onAnswer, x.answer)).toBeGreaterThanOrEqual(AA);
    expect(contrastRatio(x.onAnswer, x.answerBadge)).toBeGreaterThanOrEqual(AA);
    // A filled answer's badge is 20% white over the fill.
    expect(contrastRatio(x.onFill, blend('#FFFFFF', x.correct, 0.2))).toBeGreaterThanOrEqual(NON_TEXT);
    expect(contrastRatio(x.onFill, blend('#FFFFFF', x.wrong, 0.2))).toBeGreaterThanOrEqual(NON_TEXT);
  });

  it.each([0, 1])('white text on stage stop %i stays AA, even on the frosted chips and lifelines', (i) => {
    const stop = x.stage[i];
    expect(contrastRatio('#FFFFFF', stop)).toBeGreaterThanOrEqual(AA);
    expect(contrastRatio('#FFFFFF', blend('#FFFFFF', stop, FROST))).toBeGreaterThanOrEqual(AA);
  });

  it('draws the gold ring, stars and progress pill visibly on the stage', () => {
    for (const stop of x.stage) expect(contrastRatio(x.gold, stop)).toBeGreaterThanOrEqual(NON_TEXT);
  });

  it('keeps everything on the quiz card readable: the question, the verdict, the timer and its number', () => {
    for (const fg of [c.text, c.textMuted, c.success, c.danger, c.accent]) expect(contrastRatio(fg, x.card)).toBeGreaterThanOrEqual(AA);
    expect(contrastRatio(c.primary, x.card)).toBeGreaterThanOrEqual(NON_TEXT);
    expect(contrastRatio(c.primary, x.cardTrack)).toBeGreaterThanOrEqual(mode === 'light' ? NON_TEXT : 2);
    expect(contrastRatio(c.danger, x.cardTrack)).toBeGreaterThanOrEqual(2);
  });

  it('keeps the correct and wrong fills distinct from the stage behind them', () => {
    for (const stop of x.stage) {
      expect(contrastRatio(x.correct, stop)).toBeGreaterThan(1.05);
      expect(contrastRatio(x.wrong, stop)).toBeGreaterThan(1.05);
    }
  });
});

describe('the share card', () => {
  it('uses the light stage, so its white text is AA in either theme', () => {
    for (const stop of extraColors.light.stage) {
      expect(contrastRatio('#FFFFFF', stop)).toBeGreaterThanOrEqual(AA);
      expect(contrastRatio('#E9E4FF', stop)).toBeGreaterThanOrEqual(AA);
    }
  });
});

describe('category colors (12 distinct hues)', () => {
  it('has twelve different hues and shades', () => {
    expect(new Set(CATEGORIES.map((c) => c.color)).size).toBe(12);
    expect(new Set(CATEGORIES.map((c) => c.strong)).size).toBe(12);
  });
  it.each(CATEGORIES)('white text on the strong shade of $id is at least 4.5:1', (cat) => {
    expect(contrastRatio('#FFFFFF', cat.strong)).toBeGreaterThanOrEqual(AA);
  });
  it.each(CATEGORIES.flatMap((c) => modes.map((m) => [c.id, m] as const)))('%s icons stay visible in %s mode, on the surface and on their tint', (id, mode) => {
    const c = merged(mode);
    const tone = categoryTone(id, mode);
    expect(contrastRatio(tone.icon, c.surface)).toBeGreaterThanOrEqual(NON_TEXT);
    expect(contrastRatio(tone.icon, tone.soft)).toBeGreaterThanOrEqual(NON_TEXT);
  });
});

describe('dark mode depth', () => {
  const c = merged('dark');
  const x = extraColors.dark;
  it('gets lighter as a layer rises: background < surface < surfaceAlt < border', () => {
    const order = [c.background, c.surface, c.surfaceAlt, c.border].map(luminance);
    for (let i = 1; i < order.length; i++) expect(order[i]).toBeGreaterThan(order[i - 1]);
  });
  it('keeps a raised pill (Segmented, Stepper) visibly lighter than its track', () => {
    const { track, raised } = insetTones(c, 'dark');
    expect(luminance(raised)).toBeGreaterThan(luminance(track));
    expect(contrastRatio(raised, track)).toBeGreaterThan(1.25);
  });
  it('raises the answer pills above the stage, and their badge above the pill', () => {
    for (const stop of x.stage) {
      expect(luminance(x.answer)).toBeGreaterThan(luminance(stop));
      expect(contrastRatio(x.answer, stop)).toBeGreaterThan(1.25);
    }
    expect(luminance(x.answerBadge)).toBeGreaterThan(luminance(x.answer));
  });
  it('raises the question card above the stage, and the answers above the card', () => {
    for (const stop of x.stage) {
      expect(luminance(x.card)).toBeGreaterThan(luminance(stop));
      expect(contrastRatio(x.card, stop)).toBeGreaterThan(1.2);
    }
    expect(luminance(x.answer)).toBeGreaterThan(luminance(x.card));
  });
});

describe('type scale', () => {
  it('follows plan §7 at scale 1', () => {
    expect(scaledType(1)).toMatchObject({ display: { fontSize: 34, lineHeight: 40 }, question: { fontSize: 22, lineHeight: 30 }, answer: { fontSize: 17, lineHeight: 24 }, caption: { fontSize: 13, lineHeight: 18 } });
  });
  it('sets titles, the question and big numbers in the display family', () => {
    expect(DISPLAY_STYLES).toEqual(['display', 'h1', 'h2', 'question']);
  });
  it('grows with the text-size setting', () => {
    expect(TEXT_SCALES).toEqual([0.9, 1, 1.15, 1.3]);
    const sizes = TEXT_SCALES.map((s) => scaledType(s).body.fontSize);
    expect(sizes).toEqual([...sizes].sort((a, b) => a - b));
    expect(scaledType(1.3).answer.fontSize).toBe(Math.round(17 * 1.3));
  });
});
