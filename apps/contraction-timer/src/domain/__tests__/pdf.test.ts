import '@/testing/mocks';
import '@/bootstrap';
import { RULE_PRESETS } from '../defaults';
import { buildPdfHtml, chartSvg, escapeHtml, FREE_PDF_THEME, PDF_THEME_IDS, PDF_THEMES } from '../pdf';
import { summaryFacts } from '../summary';
import type { ContractionSession } from '../types';

const at = (h: number, m: number, s = 0) => new Date(2026, 10, 4, h, m, s).getTime();
const session = (n = 14, note?: string): ContractionSession => ({
  id: 's',
  startedAt: at(1, 0),
  endedAt: at(3, 0),
  ruleAtStart: RULE_PRESETS['511'],
  lastActivityAt: at(3, 0),
  contractions: Array.from({ length: n }, (_, i) => ({ id: `c${i}`, startedAt: at(1, 0) + i * 300_000, endedAt: at(1, 0) + i * 300_000 + 60_000 + i * 1000, note: i === 2 ? note : undefined })),
});

describe('PDF themes', () => {
  it('has the four plan themes and only "Clean" is free', () => {
    expect(PDF_THEME_IDS.sort()).toEqual(['clean', 'compact', 'contrast', 'floral']);
    expect(FREE_PDF_THEME).toBe('clean');
    expect(PDF_THEME_IDS.filter((id) => PDF_THEMES[id].free)).toEqual(['clean']);
  });
});

describe('buildPdfHtml', () => {
  const input = { session: session(), edd: '2026-11-09', clock24h: true, now: at(3, 0) };

  it('is a complete HTML document with the facts, a chart, a table of every contraction and the disclaimer footer', () => {
    const html = buildPdfHtml(input);
    expect(html.startsWith('<!doctype html>')).toBe(true);
    expect(html).toContain('Contraction summary — Wed 4 Nov 2026');
    expect(html).toContain('<svg');
    expect((html.match(/<tr/g) ?? []).length).toBe(14 + 1); // header row + one per contraction
    expect(html).toContain('Recorded with Contraction Timer. This is a personal log, not a medical assessment. Not medical advice.');
  });
  it.each(PDF_THEME_IDS)('renders in the %s theme', (id) => {
    const html = buildPdfHtml(input, id);
    expect(html).toContain(PDF_THEMES[id].accent);
    expect(html).toContain('</html>');
  });
  it('the compact theme draws fewer bars to stay on one page', () => {
    const f = summaryFacts({ ...input, session: session(60) });
    const count = (svg: string) => (svg.match(/<rect/g) ?? []).length;
    expect(count(chartSvg(f, PDF_THEMES.compact))).toBe(24);
    expect(count(chartSvg(f, PDF_THEMES.clean))).toBe(40);
  });
  it('the chart scale starts at zero so bars are honest, and is empty without data', () => {
    const f = summaryFacts(input);
    expect(chartSvg(f, PDF_THEMES.clean)).toContain('y2="119.5"');
    expect(chartSvg(summaryFacts({ ...input, session: { ...session(), contractions: [] } }), PDF_THEMES.clean)).toBe('');
  });
  it('a typed note can never become markup', () => {
    const html = buildPdfHtml({ ...input, session: session(14, '<script>alert("x")</script> & more') });
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt; &amp; more');
  });
  it('falls back to Clean for an unknown theme id', () => {
    expect(buildPdfHtml(input, 'nope' as never)).toContain(PDF_THEMES.clean.accent);
  });
  it('makes no network request: no external links, images or scripts', () => {
    const html = buildPdfHtml(input);
    expect(html.replace(/xmlns="[^"]*"/g, '')).not.toMatch(/https?:\/\//); // the SVG namespace is a name, not a request
    expect(html).not.toMatch(/<script|<link|<img/);
  });
  it('escapes the five special characters', () => {
    expect(escapeHtml(`&<>"'`)).toBe('&amp;&lt;&gt;&quot;&#39;');
  });
});
