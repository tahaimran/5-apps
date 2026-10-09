/**
 * The PDF summary, DEVELOPMENT_PLAN.md §11: the same facts as the text, laid out as HTML for
 * `expo-print`, with a small bar chart (inline SVG), a table of every contraction and the disclaimer footer.
 * Four looks: "Clean" is free; the other three are unlocked once, for good, by a rewarded video (milestone 8).
 */
import { t as defaultT } from '@shared/i18n';
import { durationOf } from './stats';
import { summaryFacts, type SummaryFacts, type SummaryInput, type Translate } from './summary';

export type PdfThemeId = 'clean' | 'floral' | 'contrast' | 'compact';

export interface PdfTheme {
  id: PdfThemeId;
  /** Free themes need no unlock. */
  free: boolean;
  ink: string;
  muted: string;
  accent: string;
  band: string;
  rule: string;
  /** Print size in px for body text. */
  fontPx: number;
  /** Cell padding in px. */
  pad: number;
  /** Bars shown in the chart (the compact theme draws fewer to stay on one page). */
  bars: number;
  borderPx: number;
}

export const PDF_THEMES: Record<PdfThemeId, PdfTheme> = {
  clean: { id: 'clean', free: true, ink: '#1f2430', muted: '#5b6070', accent: '#3E9C95', band: '#eef6f5', rule: '#c9d3d2', fontPx: 14, pad: 6, bars: 40, borderPx: 1 },
  floral: { id: 'floral', free: false, ink: '#3a2a3c', muted: '#7a6680', accent: '#b5679b', band: '#fbeef6', rule: '#e6c9dc', fontPx: 14, pad: 7, bars: 40, borderPx: 1 },
  contrast: { id: 'contrast', free: false, ink: '#000000', muted: '#222222', accent: '#000000', band: '#ffffff', rule: '#000000', fontPx: 16, pad: 7, bars: 30, borderPx: 2 },
  compact: { id: 'compact', free: false, ink: '#1f2430', muted: '#4a4f5e', accent: '#3E9C95', band: '#f3f5f7', rule: '#c9d3d2', fontPx: 11, pad: 3, bars: 24, borderPx: 1 },
};

export const PDF_THEME_IDS = Object.keys(PDF_THEMES) as PdfThemeId[];
export const FREE_PDF_THEME: PdfThemeId = 'clean';

/** Escapes text for HTML: notes are typed by the person and must never become markup. */
export const escapeHtml = (s: string): string => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

/** Bars for the length of each contraction, oldest on the left. The scale starts at zero, so bar heights are honest. */
export function chartSvg(facts: SummaryFacts, theme: PdfTheme): string {
  const rows = facts.rows
    .filter((r) => !r.ignored)
    .slice(0, theme.bars)
    .reverse();
  if (rows.length === 0) return '';
  const seconds = rows.map((r) => (durationOf(r.contraction) as number) / 1000);
  const max = Math.max(60, ...seconds);
  const w = 640;
  const h = 120;
  const gap = 3;
  const bw = Math.max(4, (w - gap * (rows.length - 1)) / rows.length);
  const bars = seconds
    .map((s, i) => {
      const bh = Math.max(1, Math.round((s / max) * (h - 18)));
      return `<rect x="${(i * (bw + gap)).toFixed(1)}" y="${h - bh}" width="${bw.toFixed(1)}" height="${bh}" fill="${theme.accent}"/>`;
    })
    .join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="100%" height="${h}" role="img">${bars}<line x1="0" y1="${h - 0.5}" x2="${w}" y2="${h - 0.5}" stroke="${theme.rule}" stroke-width="1"/></svg>`;
}

export function buildPdfHtml(input: SummaryInput, themeId: PdfThemeId = FREE_PDF_THEME, tr: Translate = defaultT): string {
  const theme = PDF_THEMES[themeId] ?? PDF_THEMES[FREE_PDF_THEME];
  const f = summaryFacts(input, tr);
  const e = escapeHtml;
  const levelText = (r: (typeof f.rows)[number]) => (r.intensity ? tr(`summary.level.${r.intensity}`) : '');
  const head = [tr('pdf.start'), tr('pdf.length'), tr('pdf.interval'), tr('pdf.strength')];
  const rows = f.rows
    .map(
      (r) =>
        `<tr${r.ignored ? ' class="ignored"' : ''}><td>${e(r.start)}</td><td>${e(r.length)}</td><td>${e(r.interval ?? tr('summary.firstGap'))}</td><td>${e(levelText(r))}${r.ignored ? ` ${e(tr('summary.ignoredMark'))}` : ''}</td></tr>`,
    )
    .join('');
  const notes = f.notes.length
    ? `<h2>${e(tr('summary.notesHeader'))}</h2><ul>${f.notes.map((n) => `<li>${e(n.time)} · ${e(n.note)}</li>`).join('')}</ul>`
    : '';
  const css = `
    body{font-family:Arial,Helvetica,sans-serif;color:${theme.ink};font-size:${theme.fontPx}px;margin:${theme.id === 'compact' ? 16 : 28}px;line-height:1.35}
    h1{font-size:${theme.fontPx + 8}px;margin:0 0 6px;color:${theme.accent}}
    h2{font-size:${theme.fontPx + 2}px;margin:14px 0 4px}
    .band{background:${theme.band};border:${theme.borderPx}px solid ${theme.rule};border-radius:8px;padding:8px 12px;margin:8px 0}
    table{border-collapse:collapse;width:100%}
    th,td{border:${theme.borderPx}px solid ${theme.rule};padding:${theme.pad}px 8px;text-align:left}
    th{background:${theme.band}}
    .ignored td{color:${theme.muted};font-style:italic}
    .foot{margin-top:18px;border-top:${theme.borderPx}px solid ${theme.rule};padding-top:8px;color:${theme.muted};font-size:${Math.max(10, theme.fontPx - 2)}px}
    ul{margin:4px 0;padding-left:20px}
  `;
  return `<!doctype html><html><head><meta charset="utf-8"><title>${e(f.title)}</title><style>${css}</style></head><body>
<h1>${e(f.title)}</h1>
${f.pregnancy ? `<div>${e(f.pregnancy)}</div>` : ''}
<div>${e(f.session)}</div>
<div class="band"><strong>${e(f.lastHour)}</strong><br>${e(f.averages)}${f.intensity ? `<br>${e(f.intensity)}` : ''}<br>${e(f.rule)}</div>
${chartSvg(f, theme)}
<h2>${e(tr('pdf.allHeader', { count: f.rows.length }))}</h2>
<table><thead><tr>${head.map((h) => `<th>${e(h)}</th>`).join('')}</tr></thead><tbody>${rows}</tbody></table>
${notes}
<div class="foot">${e(f.footer)}</div>
</body></html>`;
}
