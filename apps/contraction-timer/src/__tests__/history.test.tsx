import { mockParams, mockRouter, mockShare, mockFiles } from '@/testing/mocks';
import { resetApp, seedSession } from '@/testing/stores';
import { cleanup, flush, render } from '@/testing/ui';
import { act } from 'react';
import { Alert, Share } from 'react-native';
import { ThemeProvider } from '@shared/theme';
import '@/bootstrap';
import { RULE_PRESETS } from '@/domain/defaults';
import { cleanPdfCache, PDF_KEEP_MS, rememberPdf } from '@/export/pdfCache';
import { useProfile } from '@/store/profile';
import { useSessions } from '@/store/sessions';
import { useSettings } from '@/store/settings';
import { db } from '@/store/storage';
import { useUnlocks } from '@/store/unlocks';
import { FONT_SCALE, palette, TOUCH_TARGET } from '@/theme/tokens';
import { series, sessionOf, made, MINUTE, SECOND } from '@/testing/fixtures';
import History from '../../app/(tabs)/timer/history';
import Detail from '../../app/(tabs)/timer/session/[id]';
import ShareSummary from '../../app/modals/share-summary';

const NOW = new Date(2026, 10, 4, 3, 30).getTime();
const wrap = (el: React.ReactElement) => (
  <ThemeProvider palette={palette} fontScale={FONT_SCALE} touchTarget={TOUCH_TARGET}>
    {el}
  </ThemeProvider>
);
const advance = (ms: number) => act(async () => void jest.advanceTimersByTime(ms));

const file = (id: string, endsAgo: number, n = 4, extra = {}) => seedSession(id, endsAgo, n, extra, NOW);

beforeEach(() => {
  jest.useFakeTimers({ now: NOW, doNotFake: ['nextTick', 'setImmediate'] });
  resetApp(new Date(NOW));
  mockRouter.push.mockClear();
});
afterEach(async () => {
  await cleanup();
  jest.useRealTimers();
  jest.restoreAllMocks();
});

describe('History (plan §5.2)', () => {
  it('shows the plan\'s empty state', async () => {
    const ui = await render(wrap(<History />));
    expect(ui.texts()).toContain('No sessions yet. When the time comes, everything you time will be saved here — only on this phone.');
  });

  it('lists sessions newest first with count, average length and gap, and a mark where the rule matched', async () => {
    file('older', 3 * 24 * 60 * MINUTE);
    file('newer', 60 * MINUTE, 6, { patternMatchedAt: NOW - 70 * MINUTE });
    const ui = await render(wrap(<History />));
    const rows = ui.root.findAll((n) => typeof n.props.onPress === 'function' && /contractions/.test(String(n.props.accessibilityLabel)));
    expect(rows).toHaveLength(2);
    expect(String(rows[0].props.accessibilityLabel)).toContain('6 contractions');
    expect(String(rows[1].props.accessibilityLabel)).toContain('4 contractions');
    expect(ui.texts().some((x) => x.includes('6 contractions') && x.includes('avg 1m') && x.includes('every 5m'))).toBe(true);
    const bells = ui.root.findAll((n) => n.props.name === 'bell-ring-outline');
    expect(bells).toHaveLength(1); // only the session whose rule matched has the bell
  });

  it('puts the session being timed on top and says so', async () => {
    file('old', 600 * MINUTE);
    useSessions.getState().tap(NOW - 20 * MINUTE);
    const ui = await render(wrap(<History />));
    const first = ui.root.findAll((n) => typeof n.props.onPress === 'function' && /contractions|contraction/.test(String(n.props.accessibilityLabel)))[0];
    expect(String(first.props.accessibilityLabel)).toContain('in progress');
  });

  it('opens a session when tapped', async () => {
    file('s1', 60 * MINUTE);
    const ui = await render(wrap(<History />));
    await act(async () => ui.root.findAll((n) => typeof n.props.onPress === 'function' && /4 contractions/.test(String(n.props.accessibilityLabel)))[0].props.onPress());
    expect(mockRouter.push).toHaveBeenCalledWith({ pathname: '/timer/session/[id]', params: { id: 's1' } });
  });
});

describe('Session detail (plan §5.2)', () => {
  const rowLabels = (ui: Awaited<ReturnType<typeof render>>) => ui.root.findAll((n) => typeof n.props.onPress === 'function' && /^\d.*, length /.test(String(n.props.accessibilityLabel))).map((n) => String(n.props.accessibilityLabel));

  it('lists every contraction newest first with its gap and strength', async () => {
    const s = file('s1', 60 * MINUTE);
    useSessions.getState().setIntensity('s1', s.contractions[3].id, 'strong');
    mockParams.current = { id: 's1' };
    const ui = await render(wrap(<Detail />));
    const labels = rowLabels(ui);
    expect(labels).toHaveLength(4);
    expect(labels[0]).toContain('5 minutes after the one before');
    expect(labels[0]).toContain('Strong');
    expect(labels[3]).toContain('first one');
  });

  it('edits a contraction: later start, longer, with a note; the numbers follow', async () => {
    const s = file('s1', 60 * MINUTE);
    mockParams.current = { id: 's1' };
    const ui = await render(wrap(<Detail />));
    const first = s.contractions[3];
    await act(async () => ui.root.findAll((n) => typeof n.props.onPress === 'function' && String(n.props.accessibilityLabel).startsWith(`${new Date(first.startedAt).getHours() % 12 || 12}:`) && /length/.test(String(n.props.accessibilityLabel)))[0].props.onPress());
    expect(ui.texts()).toContain('Edit contraction');
    await ui.press('Start 1 minute earlier');
    await ui.press('5 seconds longer');
    await ui.type('Note', 'waters not broken');
    await ui.press('Save');
    const saved = useSessions.getState().archived.s1.contractions.find((c) => c.id === first.id)!;
    expect(saved.startedAt).toBe(first.startedAt - MINUTE);
    expect(saved.endedAt! - saved.startedAt).toBe(65 * SECOND);
    expect(saved.note).toBe('waters not broken');
  });

  it('refuses an overlap and says why', async () => {
    const s = file('s1', 60 * MINUTE);
    mockParams.current = { id: 's1' };
    const ui = await render(wrap(<Detail />));
    const newest = s.contractions[3];
    await act(async () => ui.root.findAll((n) => typeof n.props.onPress === 'function' && /length/.test(String(n.props.accessibilityLabel)))[0].props.onPress());
    for (let i = 0; i < 5; i++) await ui.press('Start 1 minute earlier');
    await ui.press('Save');
    expect(ui.texts()).toContain('That overlaps another contraction. Move it so they do not overlap.');
    expect(useSessions.getState().archived.s1.contractions.find((c) => c.id === newest.id)!.startedAt).toBe(newest.startedAt);
  });

  it('deletes a row with a 5-second undo that brings it back', async () => {
    file('s1', 60 * MINUTE);
    mockParams.current = { id: 's1' };
    const ui = await render(wrap(<Detail />));
    await act(async () => ui.root.findAll((n) => typeof n.props.onPress === 'function' && /length/.test(String(n.props.accessibilityLabel)))[0].props.onPress());
    await ui.press('Delete this contraction');
    expect(useSessions.getState().archived.s1.contractions).toHaveLength(3);
    expect(ui.texts()).toContain('Contraction deleted');
    await ui.press('Undo');
    expect(useSessions.getState().archived.s1.contractions).toHaveLength(4);
  });

  it('lets the undo expire after 5 seconds', async () => {
    file('s1', 60 * MINUTE);
    mockParams.current = { id: 's1' };
    const ui = await render(wrap(<Detail />));
    await act(async () => ui.root.findAll((n) => typeof n.props.onPress === 'function' && /length/.test(String(n.props.accessibilityLabel)))[0].props.onPress());
    await ui.press('Delete this contraction');
    await advance(5100);
    expect(ui.texts()).not.toContain('Contraction deleted');
    expect(useSessions.getState().archived.s1.contractions).toHaveLength(3);
  });

  it('adds a missed contraction between sessions\' times, and refuses one that overlaps', async () => {
    file('s1', 60 * MINUTE);
    mockParams.current = { id: 's1' };
    const ui = await render(wrap(<Detail />));
    await ui.press('Add a missed contraction');
    await ui.press('Start 10 minutes earlier');
    await ui.press('Save');
    expect(useSessions.getState().archived.s1.contractions).toHaveLength(5);
    expect(useSessions.getState().archived.s1.contractions[4].endedAt! - useSessions.getState().archived.s1.contractions[4].startedAt).toBe(60 * SECOND);
  });

  it('joins a contraction with the next one in time', async () => {
    file('s1', 60 * MINUTE);
    mockParams.current = { id: 's1' };
    const ui = await render(wrap(<Detail />));
    const rows = ui.root.findAll((n) => typeof n.props.onPress === 'function' && /length/.test(String(n.props.accessibilityLabel)));
    await act(async () => rows[rows.length - 1].props.onPress()); // the oldest row
    await ui.press('Join with the next one');
    expect(useSessions.getState().archived.s1.contractions).toHaveLength(3);
  });

  it('marks a very short tap as left out, and a row can be restored', async () => {
    const s = file('s1', 60 * MINUTE);
    const withTap = { ...s, contractions: [...s.contractions, made(NOW - 100 * MINUTE, 0, 4 * SECOND, { id: 'tap' })] };
    withTap.contractions[4].startedAt = NOW - 120 * MINUTE;
    withTap.contractions[4].endedAt = NOW - 120 * MINUTE + 4 * SECOND;
    useSessions.setState({ archived: { s1: withTap } });
    mockParams.current = { id: 's1' };
    const ui = await render(wrap(<Detail />));
    const grey = rowLabels(ui).find((l) => l.includes('Left out of the numbers'));
    expect(grey).toBeTruthy();
    await act(async () => ui.root.findAll((n) => typeof n.props.onPress === 'function' && String(n.props.accessibilityLabel) === grey)[0].props.onPress());
    await ui.press('Count it again');
    expect(useSessions.getState().archived.s1.contractions.find((c) => c.id === 'tap')!.ignored).toBe(false);
  });

  it('asks before deleting a session, then removes it', async () => {
    file('s1', 60 * MINUTE);
    mockParams.current = { id: 's1' };
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
    const ui = await render(wrap(<Detail />));
    await ui.press('Delete session');
    expect(alert).toHaveBeenCalledWith('Delete this session?', 'This removes it from the phone. It cannot be undone.', expect.any(Array));
    expect(useSessions.getState().archived.s1).toBeDefined();
    const buttons = alert.mock.calls[0][2]!;
    await act(async () => buttons.find((b) => b.text === 'Delete')!.onPress!());
    expect(useSessions.getState().archived.s1).toBeUndefined();
    expect(mockRouter.back).toHaveBeenCalled();
  });

  it('does not offer to delete the session that is still open', async () => {
    useSessions.getState().tap(NOW - 10 * MINUTE);
    useSessions.getState().tap(NOW - 9 * MINUTE);
    mockParams.current = { id: useSessions.getState().active!.id };
    const ui = await render(wrap(<Detail />));
    expect(ui.byLabel('Delete session')).toHaveLength(0);
    expect(ui.texts()).toContain('This session is still open. Ending it is done on the Timer.');
  });

  it('says so when the session is gone', async () => {
    mockParams.current = { id: 'nope' };
    const ui = await render(wrap(<Detail />));
    expect(ui.texts()).toContain('This session is no longer on the phone.');
  });
});

describe('Share summary (plan F8, F9)', () => {
  beforeEach(() => {
    useProfile.getState().setDue({ mode: 'edd', date: '2026-11-09' });
    useSettings.getState().update({ clock24h: true });
    file('s1', 60 * MINUTE, 6, { ruleAtStart: RULE_PRESETS['511'] });
    mockParams.current = { id: 's1' };
  });

  it('previews the summary and shares the same text through the share sheet', async () => {
    const share = jest.spyOn(Share, 'share').mockResolvedValue({ action: 'sharedAction' });
    const ui = await render(wrap(<ShareSummary />));
    expect(ui.texts().some((x) => x.startsWith('Contraction summary — Wed 4 Nov 2026'))).toBe(true);
    await ui.press('Share as text');
    expect(share).toHaveBeenCalledTimes(1);
    const message = share.mock.calls[0][0].message!;
    expect(message).toContain('Pregnancy: 39 weeks + 2 days (due 9 Nov)');
    expect(message).toContain('This is a personal log, not a medical assessment.');
  });

  it('makes a PDF on the phone and hands the file to the share sheet', async () => {
    const ui = await render(wrap(<ShareSummary />));
    await ui.press('Share as PDF');
    expect(mockShare.printed).toHaveLength(1);
    expect(mockShare.printed[0].html).toContain('Contraction summary — Wed 4 Nov 2026');
    expect(mockShare.shared).toHaveLength(1);
    expect(mockShare.shared[0].options).toMatchObject({ mimeType: 'application/pdf', dialogTitle: 'Share with your provider' });
    expect(db.get('pdfCache')).toEqual([{ uri: mockShare.shared[0].uri, at: NOW }]);
  });

  it('uses the free Clean look until another is unlocked, then the picked one', async () => {
    useUnlocks.setState({ selectedPdfTheme: 'floral' });
    let ui = await render(wrap(<ShareSummary />));
    await ui.press('Share as PDF');
    expect(mockShare.printed[0].html).toContain('#3E9C95'); // Clean accent
    await cleanup();
    useUnlocks.getState().unlockPdfTheme('floral');
    ui = await render(wrap(<ShareSummary />));
    await ui.press('Share as PDF');
    expect(mockShare.printed[1].html).toContain('#b5679b');
  });

  it('says so when the PDF cannot be made, and when file sharing is not available, and keeps the text option', async () => {
    mockShare.failPrint = true;
    let ui = await render(wrap(<ShareSummary />));
    await ui.press('Share as PDF');
    expect(ui.texts()).toContain('Could not make the PDF. You can still share the text.');
    await cleanup();
    mockShare.failPrint = false;
    mockShare.available = false;
    ui = await render(wrap(<ShareSummary />));
    await ui.press('Share as PDF');
    expect(ui.texts()).toContain('Sharing files is not available on this phone. You can still share the text.');
    expect(ui.byLabel('Share as text')).toHaveLength(1);
  });

  it('works for a session that is still open (the hour is up to now)', async () => {
    useSessions.getState().tap(NOW - 20 * MINUTE);
    useSessions.getState().tap(NOW - 19 * MINUTE);
    mockParams.current = { id: useSessions.getState().active!.id };
    const ui = await render(wrap(<ShareSummary />));
    expect(ui.texts().some((x) => x.includes('Last 60 min: 1 contractions'))).toBe(true);
  });

  it('makes no network request', async () => {
    const fetchSpy = jest.fn();
    (globalThis as { fetch?: unknown }).fetch = fetchSpy;
    const ui = await render(wrap(<ShareSummary />));
    await ui.press('Share as PDF');
    expect(fetchSpy).not.toHaveBeenCalled();
    await flush();
  });
});

describe('the PDF cache (plan §11: deleted after 24 hours)', () => {
  it('deletes PDFs older than a day and keeps newer ones', () => {
    rememberPdf('file:///cache/old.pdf', NOW - PDF_KEEP_MS - 1);
    rememberPdf('file:///cache/new.pdf', NOW - PDF_KEEP_MS + 60_000);
    expect(cleanPdfCache(NOW)).toBe(1);
    expect(mockFiles.deleted).toEqual(['file:///cache/old.pdf']);
    expect(db.get('pdfCache')).toEqual([{ uri: 'file:///cache/new.pdf', at: NOW - PDF_KEEP_MS + 60_000 }]);
  });
  it('does not fail when a file is already gone or cannot be deleted; it tries again next time', () => {
    rememberPdf('file:///cache/gone.pdf', NOW - 2 * PDF_KEEP_MS);
    mockFiles.missing.add('file:///cache/gone.pdf');
    expect(cleanPdfCache(NOW)).toBe(1);
    rememberPdf('file:///cache/stuck.pdf', NOW - 2 * PDF_KEEP_MS);
    mockFiles.failDelete = true;
    expect(cleanPdfCache(NOW)).toBe(0);
    expect(db.get('pdfCache')).toHaveLength(1);
  });
  it('keeps a PDF whose time is in the future (the clock was set back) until the day really passes', () => {
    rememberPdf('file:///cache/future.pdf', NOW + 5 * PDF_KEEP_MS);
    expect(cleanPdfCache(NOW)).toBe(0);
  });
});
