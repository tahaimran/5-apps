import weeksEn from '../../assets/content/weeks.en.json';

/** One week-by-week card (plan §9 "Content"). */
export interface WeekCard {
  week: number;
  /** "cantaloupe" */
  size: string;
  emoji?: string;
  lengthCm: number;
  /** 0 means "under a gram". */
  weightG: number;
  /** Up to week 19 the length is crown to rump; from week 20 it is head to heel. */
  measure: 'crown-rump' | 'head-to-heel';
  bullets: string[];
  askProvider: string;
}

export const WEEK_CARDS = weeksEn as WeekCard[];
export const FIRST_WEEK = 4;
export const LAST_WEEK = 42;

export const weekCard = (week: number): WeekCard | null => WEEK_CARDS.find((w) => w.week === week) ?? null;

export type Units = 'metric' | 'imperial';

/** The week whose card is pinned: the current week, kept within the weeks that have a card. */
export const currentCardWeek = (weeks: number): number => Math.min(LAST_WEEK, Math.max(FIRST_WEEK, weeks));

/** Cards in list order: the current week first, then every other week ascending. */
export function orderedCards(currentWeek: number | null): WeekCard[] {
  if (currentWeek === null) return WEEK_CARDS;
  const pinned = weekCard(currentCardWeek(currentWeek));
  return pinned ? [pinned, ...WEEK_CARDS.filter((w) => w.week !== pinned.week)] : WEEK_CARDS;
}

const round1 = (n: number) => Math.round(n * 10) / 10;

/** "25.6 cm" or "10.1 in". */
export function lengthText(cm: number, units: Units): string {
  return units === 'imperial' ? `${round1(cm / 2.54)} in` : `${round1(cm)} cm`;
}

/** "300 g", "1.1 kg", "10.6 oz", "2.4 lb"; `weightG` 0 is "under 1 g" (the caller supplies the words). */
export function weightText(g: number, units: Units, under1g: string): string {
  if (g <= 0) return under1g;
  if (units === 'imperial') {
    const oz = g / 28.3495;
    return oz < 16 ? `${round1(oz)} oz` : `${round1(oz / 16)} lb`;
  }
  return g < 1000 ? `${Math.round(g)} g` : `${round1(g / 1000)} kg`;
}

/** Whether the phone's region uses imperial units. */
export const unitsForRegion = (measurementSystem: string | null | undefined): Units => (measurementSystem === 'us' || measurementSystem === 'uk' ? 'imperial' : 'metric');
