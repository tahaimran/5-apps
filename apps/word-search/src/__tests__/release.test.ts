/** RELEASE.md and the plan's checklist must stay honest: nothing is claimed as done on a device. */
import * as fs from 'fs';
import * as path from 'path';

const ROOT = path.resolve(__dirname, '../..');
const doc = fs.readFileSync(path.join(ROOT, 'RELEASE.md'), 'utf8');
const plan = fs.readFileSync(path.join(ROOT, 'DEVELOPMENT_PLAN.md'), 'utf8');
const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8')) as { scripts: Record<string, string> };

describe('RELEASE.md', () => {
  it('says plainly that nothing was run on a device', () => {
    expect(doc).toMatch(/Nothing in this app has been run on a device or an emulator/);
    expect(doc).toMatch(/No Android build was made/);
  });

  it('leaves every device QA row open', () => {
    const section = doc.split('## 4. Device QA matrix')[1].split('## 5.')[0];
    const rows = section.split('\n').filter((l) => l.startsWith('| ') && !l.startsWith('| Area') && !l.startsWith('|---'));
    expect(rows.length).toBeGreaterThan(20);
    for (const row of rows) expect(row.trim().endsWith('| open |')).toBe(true);
  });

  it('lists the checks that need a phone, an account or a store', () => {
    for (const word of ['TalkBack', 'UMP', '16 KB', 'Reduce motion', 'Moto G', 'never scrolls the page', 'Haptics', 'Atkinson', 'closed testing']) {
      expect(doc).toContain(word);
    }
  });

  it('says what is not built, so nobody mistakes this for a finished app', () => {
    expect(doc).toMatch(/milestones? 8/i);
    for (const word of ['reminder', 'sounds', 'review prompt', 'Help screen', 'Data safety']) expect(doc.toLowerCase()).toContain(word.toLowerCase());
    expect(doc).toMatch(/\*\*not built\*\*|Not built/);
  });

  it('flags the store text that describes features that are not built', () => {
    expect(doc).toContain('ASO claims');
    for (const word of ['Gentle sounds', 'Garden', 'Kitchen', 'Movies', 'Everyday Life']) expect(doc).toContain(word);
  });

  it('tells the truth about the failing commit and the flaky shared run', () => {
    expect(doc).toContain('e54106a');
    expect(doc).toMatch(/Habit Tracker's Jest run failed once/);
  });

  it('documents the shared-package change', () => {
    expect(doc).toContain('onFullScreenAdShown');
  });

  it('has no unfilled placeholders', () => {
    expect(doc).not.toMatch(/__[A-Z]+__/);
  });

  it('names the time-zone script that exists', () => {
    expect(doc).toContain('npm run test:tz');
    expect(pkg.scripts['test:tz']).toContain('TZ=');
  });
});

describe('plan checklist (§16)', () => {
  const lines = plan.split('\n').filter((l) => /^- \[[ x]\] \*\*Day \d+/.test(l));

  it('has the ten days', () => {
    expect(lines).toHaveLength(10);
  });

  it('ticks days 1 to 7 only, and notes inline what a device is still needed for', () => {
    for (const line of lines) {
      const day = Number(/Day (\d+)/.exec(line)![1]);
      if (day <= 7) {
        expect(line.startsWith('- [x]')).toBe(true);
        // every ticked line carries an honest note about what was only checked in jest, or needs a device or account
        expect(line).toMatch(/device|jest|not (?:done|seen|added|untested)|never|account/i);
      } else {
        expect(line.startsWith('- [ ]')).toBe(true);
      }
    }
  });

  it('does not claim a physical phone was used', () => {
    const day1 = lines.find((l) => /Day 1 /.test(l))!;
    expect(day1).toMatch(/~~install dev client on a physical Android phone~~/);
    expect(day1).toMatch(/not done/);
  });
});
