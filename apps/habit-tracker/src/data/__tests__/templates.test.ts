// The JSON glyph map avoids loading the font runtime in Jest.
import glyphMap from '@expo/vector-icons/build/vendor/react-native-vector-icons/glyphmaps/MaterialCommunityIcons.json';
import en from '@/i18n/en.json';
import { categoryIds } from '@/domain/categories';
import { habitColors } from '@/theme/tokens';
import { habitIcons } from '../icons';
import { templates, templatesIn } from '../templates';

const glyphs = glyphMap as Record<string, number>;
const names = (en as { templates: Record<string, { name: string; unit?: string }> }).templates;

describe('templates', () => {
  it('has at least 40, with unique ids', () => {
    expect(templates.length).toBeGreaterThanOrEqual(40);
    expect(new Set(templates.map((t) => t.id)).size).toBe(templates.length);
  });
  it('spans 6 categories', () => {
    const used = new Set(templates.map((t) => t.category));
    expect(used.size).toBe(6);
    for (const c of used) expect(categoryIds).toContain(c);
    for (const c of used) expect(templatesIn(c).length).toBeGreaterThanOrEqual(5);
  });
  it('uses real icons and palette colors', () => {
    for (const t of templates) {
      expect(glyphs[t.icon]).toBeDefined();
      expect(habitColors[t.color]).toBeDefined();
    }
  });
  it('has a localized name, and a unit for count templates', () => {
    for (const t of templates) {
      expect(names[t.id]?.name).toBeTruthy();
      if (t.type === 'count') expect(names[t.id].unit).toBeTruthy();
      expect(!!names[t.id].unit).toBe(!!t.hasUnit);
    }
  });
  it('has sane targets and reminder times', () => {
    for (const t of templates) {
      if (t.type === 'boolean') expect(t.target).toBe(1);
      else expect(t.target).toBeGreaterThanOrEqual(1);
      expect(t.reminder).toMatch(/^([01]\d|2[0-3]):[0-5]\d$/);
      if (t.schedule.kind === 'weekdays') expect(t.schedule.days.length).toBeGreaterThan(0);
    }
  });
});

describe('editor icons', () => {
  it('offers 60 unique, valid icons', () => {
    expect(habitIcons).toHaveLength(60);
    expect(new Set(habitIcons).size).toBe(60);
    for (const i of habitIcons) expect(glyphs[i]).toBeDefined();
  });
});
