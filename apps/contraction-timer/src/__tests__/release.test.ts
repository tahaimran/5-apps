/** RELEASE.md and the plan's status list must stay honest: nothing is claimed as done on a device, and nothing clinical as reviewed. */
import * as fs from 'fs';
import * as path from 'path';

const ROOT = path.resolve(__dirname, '../..');
const doc = fs.readFileSync(path.join(ROOT, 'RELEASE.md'), 'utf8');
const plan = fs.readFileSync(path.join(ROOT, 'DEVELOPMENT_PLAN.md'), 'utf8');
const aso = fs.readFileSync(path.join(ROOT, 'ASO.md'), 'utf8');
const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8')) as { scripts: Record<string, string> };

describe('RELEASE.md', () => {
  it('says plainly that nothing was run on a device', () => {
    expect(doc).toMatch(/Nothing in this app has been run on a device or an emulator/);
    expect(doc).toMatch(/No Android build was made/);
  });

  it('says the timing logic was only unit-tested and was never used by a real person in labour', () => {
    expect(doc).toMatch(/checked only against unit tests and fixtures/);
    expect(doc).toMatch(/has not been used by a real person in labour/);
  });

  it('leaves every device QA row open', () => {
    const section = doc.split('## 4. Device QA matrix')[1].split('## 5.')[0];
    const rows = section.split('\n').filter((l) => l.startsWith('| ') && !l.startsWith('| Area') && !l.startsWith('|---'));
    expect(rows.length).toBeGreaterThan(30);
    for (const row of rows) expect(row.trim().endsWith('| open |')).toBe(true);
  });

  it('lists the checks that need a phone, an account or a store', () => {
    for (const word of ['TalkBack', 'UMP', '16 KB', 'Reduce motion', 'Moto G', 'never scroll the page', 'Haptics', 'Doze', 'Samsung', 'Xiaomi', 'closed testing', 'adb shell am kill', 'airplane mode', 'Airplane mode']) {
      expect(doc).toContain(word);
    }
  });

  it('says what is not built, so nobody mistakes this for a finished app', () => {
    expect(doc).toMatch(/milestone 9/i);
    for (const word of ['Data safety', 'Health apps declaration', 'screenshots', 'privacy policy', 'Maestro', 'Sentry', 'ongoing notification']) {
      expect(doc.toLowerCase()).toContain(word.toLowerCase());
    }
    expect(doc).toMatch(/\*\*not built\*\*|Not built/);
  });

  it('lists the clinical, legal and policy review as open items for a human', () => {
    const section = doc.split('## 7. Clinical, legal and policy review')[1].split('## 8.')[0];
    for (const word of ['Health apps declaration', 'Disclaimer wording', 'pattern alert', 'midwife', 'week cards', 'kick counter', 'privacy policy', 'usability study', 'stopwatch']) {
      expect(section.toLowerCase()).toContain(word.toLowerCase());
    }
    expect(section).toMatch(/None of this was done/);
  });

  it('flags every claim in the store listing that the build does not support', () => {
    expect(doc).toContain('ASO claims');
    // Each claim is checked only while its text is still in the listing: fix the listing and the claim may go from the list.
    const claims: [RegExp, string][] = [
      [/Consider calling them now/, 'Consider calling them now'],
      [/LABOR PATTERN ALERT/, 'LABOR PATTERN ALERT'],
      [/usual rhythm/, "usual rhythm"],
      [/in two taps/, 'two taps'],
      [/Keeps timing even if your phone locks or the app is closed/, 'Keeps timing even if'],
      [/Is Contraction Timer helping you feel prepared/, 'pre-prompt'],
    ];
    for (const [pattern, mention] of claims) if (pattern.test(aso)) expect(doc).toContain(mention);
  });

  it('tells the truth about the pre-existing date-dependent failure in Habit Tracker, and that shared was not changed', () => {
    expect(doc).toContain('today.smoke.test.tsx');
    expect(doc).toMatch(/fails on any day but 2026-10-08/);
    expect(doc).toMatch(/Changes to `packages\/shared`:\*\* none/);
  });

  it('records the privacy-relevant decisions', () => {
    expect(doc).toContain('allowBackup');
    expect(doc).toMatch(/Android automatic backup off/);
    expect(doc).toContain('RECEIVE_BOOT_COMPLETED');
  });

  it('names the deviations that change safety behaviour', () => {
    for (const word of ['recency', 'double-tap guard', 'Ads are stricter than the plan', 'high-contrast', 'Delete all data keeps']) expect(doc.toLowerCase()).toContain(word.toLowerCase());
  });

  it('has no unfilled placeholders', () => {
    expect(doc).not.toMatch(/__[A-Z]+__|TODO|TBD|XXX/);
  });

  it('names the time-zone script that exists', () => {
    expect(doc).toContain('npm run test:tz');
    expect(pkg.scripts['test:tz']).toContain('TZ=');
    expect(pkg.scripts.check).toBeTruthy();
  });
});

describe('plan status list (§19)', () => {
  const lines = plan.split('\n').filter((l) => /^- \[[ x]\] \*\*Day \d+/.test(l));

  it('has the nine days of §17', () => {
    expect(lines).toHaveLength(9);
  });

  it('ticks days 1 to 8 only, and notes inline what a device or an account is still needed for', () => {
    for (const line of lines) {
      const day = Number(/Day (\d+)/.exec(line)![1]);
      if (day <= 8) {
        expect(line.startsWith('- [x]')).toBe(true);
        expect(line).toMatch(/device|jest|not done|account|not built|not reviewed|NOT been reviewed/i);
      } else {
        expect(line.startsWith('- [ ]')).toBe(true);
        expect(line).toMatch(/Not built/);
      }
    }
  });

  it('does not claim a phone was used or content was reviewed', () => {
    expect(plan).toMatch(/\*\*Nothing has run on a device\*\*/);
    const day6 = lines.find((l) => /Day 6\*\*/.test(l))!;
    expect(day6).toMatch(/NOT been reviewed by a midwife or doctor/);
    const day1 = lines.find((l) => /Day 1\*\*/.test(l))!;
    expect(day1).toMatch(/Not done: installing an EAS dev build on a phone/);
  });
});
