import { addItem, applyTemplate, buildChecklist, checklistText, CHECKLIST_CONTENT, groupsOf, moveItem, progressOf, removeItem, TEMPLATE_IDS, toggleItem } from '../checklists';

const NOW = 1_000;

describe('prefilled lists (plan F13, F14)', () => {
  it('the hospital bag has three groups: Mom, Partner and Baby', () => {
    expect(groupsOf(buildChecklist('hospitalBag', NOW)).map((g) => g.group)).toEqual(['mom', 'partner', 'baby']);
  });
  it('the birth plan covers pain relief, environment, cord clamping and feeding', () => {
    const text = JSON.stringify(CHECKLIST_CONTENT.birthPlan).toLowerCase();
    for (const word of ['pain relief', 'lighting', 'cord clamping', 'feed']) expect(text).toContain(word);
  });
  it('items have unique ids and start unchecked', () => {
    for (const id of ['hospitalBag', 'birthPlan'] as const) {
      const c = buildChecklist(id, NOW);
      expect(new Set(c.items.map((i) => i.id)).size).toBe(c.items.length);
      expect(c.items.every((i) => !i.checked)).toBe(true);
      expect(c.items.length).toBeGreaterThan(10);
    }
  });
  it('the birth plan is written as things to think about, never as instructions or promises', () => {
    const text = JSON.stringify(CHECKLIST_CONTENT.birthPlan).toLowerCase();
    for (const bad of ['you must', 'you should', 'guarantee', 'safe', 'dangerous']) expect(text).not.toContain(bad);
  });
});

describe('editing', () => {
  const base = () => buildChecklist('hospitalBag', NOW);
  it('checks and unchecks, and counts progress as a whole percentage', () => {
    let c = base();
    expect(progressOf(c).percent).toBe(0);
    const first = c.items[0].id;
    c = toggleItem(c, first, 2);
    expect(progressOf(c)).toMatchObject({ checked: 1, total: c.items.length });
    expect(c.updatedAt).toBe(2);
    expect(toggleItem(c, first, 3).items[0].checked).toBe(false);
    for (const i of c.items) c = toggleItem(c, i.id, 4);
    expect(progressOf({ ...c, items: c.items.map((i) => ({ ...i, checked: true })) }).percent).toBe(100);
  });
  it('rounds progress and copes with an empty list', () => {
    const c = base();
    const three = { ...c, items: c.items.slice(0, 3).map((i, n) => ({ ...i, checked: n === 0 })) };
    expect(progressOf(three).percent).toBe(33);
    expect(progressOf({ ...c, items: [] })).toEqual({ checked: 0, total: 0, percent: 0 });
  });
  it('adds the person\'s own item at the end of its group, and ignores blank text', () => {
    const c = addItem(base(), 'partner', '  Playlist ', 5, () => 'mine');
    const partner = groupsOf(c).find((g) => g.group === 'partner')!.items;
    expect(partner[partner.length - 1]).toMatchObject({ id: 'mine', label: 'Playlist', custom: true, checked: false });
    expect(addItem(base(), 'baby', '   ', 5)).toEqual(base());
  });
  it('adds to a group that does not exist yet at the end', () => {
    const c = addItem({ ...base(), items: [] }, 'mom', 'Slippers', 5, () => 'x');
    expect(c.items).toHaveLength(1);
  });
  it('deletes any item, built in or the person\'s own', () => {
    const c = base();
    expect(removeItem(c, c.items[0].id, 9).items).toHaveLength(c.items.length - 1);
  });
  it('reorders within a group only: the first item cannot go up, and one never crosses into another group', () => {
    const c = base();
    const mom = groupsOf(c)[0].items;
    expect(moveItem(c, mom[0].id, 'up', 9)).toBe(c);
    const down = moveItem(c, mom[0].id, 'down', 9);
    expect(groupsOf(down)[0].items.map((i) => i.id).slice(0, 2)).toEqual([mom[1].id, mom[0].id]);
    expect(moveItem(c, mom[mom.length - 1].id, 'down', 9)).toBe(c);
    expect(groupsOf(down).map((g) => g.group)).toEqual(['mom', 'partner', 'baby']);
    expect(moveItem(c, 'nope', 'down', 9)).toBe(c);
  });
});

describe('templates (the rewarded unlocks)', () => {
  it('has the four from the plan: C-section bag, NICU bag, twins, birth-center plan', () => {
    expect([...TEMPLATE_IDS].sort()).toEqual(['birthCenter', 'csection', 'nicu', 'twins']);
  });
  it('adds a bag template to the hospital bag once, into the right groups, and refuses the wrong list', () => {
    const c = buildChecklist('hospitalBag', NOW);
    const withNicu = applyTemplate(c, 'nicu', 7);
    expect(withNicu.items.length).toBeGreaterThan(c.items.length);
    expect(applyTemplate(withNicu, 'nicu', 8).items).toHaveLength(withNicu.items.length);
    expect(applyTemplate(c, 'birthCenter', 7)).toBe(c);
    expect(applyTemplate(c, 'nope', 7)).toBe(c);
    expect(groupsOf(withNicu).map((g) => g.group)).toEqual(['mom', 'partner', 'baby']);
  });
  it('adds the birth-center plan to the birth plan', () => {
    const c = applyTemplate(buildChecklist('birthPlan', NOW), 'birthCenter', 7);
    expect(c.items.some((i) => i.id.startsWith('tpl.birthCenter.'))).toBe(true);
  });
});

describe('text export', () => {
  it('prints the groups with a mark for each item', () => {
    let c = buildChecklist('birthPlan', NOW);
    c = toggleItem(c, c.items[0].id, 2);
    const text = checklistText(c, 'My birth plan', (g) => g.toUpperCase(), '[x]', '[ ]');
    expect(text.split('\n')[0]).toBe('My birth plan');
    expect(text).toContain('SUPPORT');
    expect(text).toContain(`  [x] ${c.items[0].label}`);
    expect(text).toContain('  [ ] ');
  });
});
