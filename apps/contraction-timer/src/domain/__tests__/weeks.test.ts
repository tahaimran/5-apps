import { currentCardWeek, FIRST_WEEK, LAST_WEEK, lengthText, orderedCards, unitsForRegion, weekCard, WEEK_CARDS, weightText } from '../weeks';

describe('week-by-week content (plan F12)', () => {
  it('has a card for every week from 4 to 42, in order', () => {
    expect(WEEK_CARDS.map((w) => w.week)).toEqual(Array.from({ length: LAST_WEEK - FIRST_WEEK + 1 }, (_, i) => FIRST_WEEK + i));
  });
  it('has the plan\'s own examples: week 34 a cantaloupe and week 35 a honeydew melon', () => {
    expect(weekCard(34)!.size).toBe('cantaloupe');
    expect(weekCard(35)!.size).toBe('honeydew melon');
    expect(weekCard(35)!.emoji).toBe('🍈');
  });
  it('every card has a size, 3 bullets and an "ask your provider" tip, all of a readable length', () => {
    for (const w of WEEK_CARDS) {
      expect(w.size.length).toBeGreaterThan(2);
      expect(w.bullets).toHaveLength(3);
      for (const b of w.bullets) {
        expect(b.length).toBeGreaterThan(15);
        expect(b.length).toBeLessThanOrEqual(150);
      }
      expect(w.askProvider.startsWith('Ask')).toBe(true);
      expect(w.askProvider.length).toBeLessThanOrEqual(150);
    }
  });
  it('size and weight never go down from one week to the next, and length only drops where the way of measuring changes (week 20)', () => {
    for (let i = 1; i < WEEK_CARDS.length; i++) {
      const [a, b] = [WEEK_CARDS[i - 1], WEEK_CARDS[i]];
      expect(b.weightG).toBeGreaterThanOrEqual(a.weightG);
      if (a.measure === b.measure) expect(b.lengthCm).toBeGreaterThanOrEqual(a.lengthCm);
    }
    expect(weekCard(19)!.measure).toBe('crown-rump');
    expect(weekCard(20)!.measure).toBe('head-to-heel');
  });
  it('never predicts or diagnoses: no wording about knowing when labor starts, and no instructions to do or not do things medically', () => {
    const all = JSON.stringify(WEEK_CARDS).toLowerCase();
    for (const bad of ['you are in labor', 'you will go into labor', 'diagnos', 'will give birth on', 'guarantee', 'safe to ignore', 'nothing to worry', 'do not worry', 'is nothing', 'you should not']) {
      expect(all).not.toContain(bad);
    }
  });
  it('keeps the plan\'s past-due wording for week 42', () => {
    expect(weekCard(42)!.bullets[0]).toContain('your provider will guide next steps');
  });
  it('points to the provider about what to watch for before calling, in the weeks the app is used for timing', () => {
    expect(weekCard(34)!.askProvider).toContain('5-1-1');
  });
});

describe('ordering', () => {
  it('pins the current week first, then the rest ascending', () => {
    const cards = orderedCards(34);
    expect(cards[0].week).toBe(34);
    expect(cards.slice(1).map((c) => c.week)).toEqual(WEEK_CARDS.map((c) => c.week).filter((w) => w !== 34));
  });
  it('keeps to weeks that have a card, and lists them all without a due date', () => {
    expect(currentCardWeek(2)).toBe(4);
    expect(currentCardWeek(44)).toBe(42);
    expect(orderedCards(null)).toBe(WEEK_CARDS);
    expect(orderedCards(1)[0].week).toBe(4);
  });
});

describe('units', () => {
  it('shows centimetres and grams or kilograms', () => {
    expect(lengthText(25.6, 'metric')).toBe('25.6 cm');
    expect(weightText(300, 'metric', 'under 1 g')).toBe('300 g');
    expect(weightText(1005, 'metric', 'under 1 g')).toBe('1 kg');
    expect(weightText(2146, 'metric', 'under 1 g')).toBe('2.1 kg');
    expect(weightText(0, 'metric', 'under 1 g')).toBe('under 1 g');
  });
  it('shows inches, ounces and pounds', () => {
    expect(lengthText(25.4, 'imperial')).toBe('10 in');
    expect(weightText(300, 'imperial', 'x')).toBe('10.6 oz');
    expect(weightText(2146, 'imperial', 'x')).toBe('4.7 lb');
  });
  it('picks imperial for US and UK regions only', () => {
    expect(unitsForRegion('us')).toBe('imperial');
    expect(unitsForRegion('uk')).toBe('imperial');
    expect(unitsForRegion('metric')).toBe('metric');
    expect(unitsForRegion(undefined)).toBe('metric');
  });
});
