/** RELEASE.md and the plan's checklist must stay honest: nothing is claimed as done on a device or a store. */
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

  it('says plainly that the questions were not fact-checked', () => {
    expect(doc).toMatch(/The 3,600 questions have not been fact-checked/);
    expect(doc).toMatch(/no human spot check/i);
    expect(fs.existsSync(path.join(ROOT, 'content/review/flagged-by-writers.md'))).toBe(true);
  });

  it('leaves every device QA row open', () => {
    const section = doc.split('## 4. Device QA matrix')[1].split('## 5.')[0];
    const rows = section.split('\n').filter((l) => l.startsWith('| ') && !l.startsWith('| Area') && !l.startsWith('|---'));
    expect(rows.length).toBeGreaterThan(25);
    for (const row of rows) expect(row.trim().endsWith('| open |')).toBe(true);
  });

  it('lists the checks that need a phone, an account or a store', () => {
    for (const word of ['TalkBack', 'UMP', '16 KB', 'Reduce motion', 'Doze', 'reboot', 'Samsung', 'Xiaomi', 'silent mode', 'review dialog', 'closed testing', 'Inter', 'under 30 s', 'share sheet']) {
      expect(doc).toContain(word);
    }
  });

  it('says what is not built, so nobody mistakes this for a finished app', () => {
    expect(doc).toMatch(/milestone 9/i);
    for (const word of ['Data safety', 'screenshots', 'production release build', 'expo-updates', 'Sentry', 'Maestro', 'factcheck.ts', 'background music']) expect(doc).toContain(word);
    expect(doc).toMatch(/\*\*Not built/);
  });

  it('flags the store text that describes things that are not backed up', () => {
    expect(doc).toContain('ASO claims');
    for (const claim of ['Each question is checked for accuracy', 'regular content updates', 'IQ Test mode', 'flags are asked from text descriptions']) expect(doc).toContain(claim);
  });

  it('tells the truth about the flaky habit-tracker run and the gate', () => {
    expect(doc).toMatch(/habit-tracker/);
    expect(doc).toMatch(/UTC midnight/);
    expect(doc).toMatch(/No commit was pushed with a failing test/);
    expect(doc).toMatch(/Milestones 3 and 4 share one commit/);
  });

  it('documents the shared-package change and the extended test double', () => {
    expect(doc).toContain('isConsentFormRequired');
    expect(doc).toContain('adsNative.ts');
  });

  it('has no unfilled placeholders', () => {
    expect(doc).not.toMatch(/__[A-Z]+__/);
    expect(doc).not.toMatch(/TODO|FIXME|XXX/);
  });

  it('keeps the notification checks that only a phone can do open', () => {
    for (const word of ['Doze', 'reboot', 'Samsung', 'Xiaomi', 'quizora://daily', 'replaces today\'s reminder']) expect(doc).toContain(word);
    expect(doc).toContain('one-off notifications');
  });

  it('names the scripts that exist', () => {
    expect(doc).toContain('npm run test:tz');
    expect(pkg.scripts['test:tz']).toContain('TZ=');
    expect(doc).toContain('npm run check');
    expect(pkg.scripts.check).toBeTruthy();
    for (const script of ['scripts/build-bank.mjs', 'scripts/check-raw.mjs', 'scripts/check.sh']) expect(fs.existsSync(path.join(ROOT, script))).toBe(true);
  });

  it('keeps the pre-commit gate from hiding a failing test', () => {
    const gate = fs.readFileSync(path.join(ROOT, 'scripts/check.sh'), 'utf8');
    expect(gate).toMatch(/set -euo pipefail/);
    expect(gate).toMatch(/^npx jest$/m); // not piped into tail or head
    expect(gate).not.toMatch(/jest[^\n]*\|/);
  });

  it('lists the permissions the app really declares', () => {
    const config = require('../../app.config').default as { android: { permissions: string[]; blockedPermissions: string[] } };
    for (const p of config.android.permissions) expect(doc).toContain(p);
    for (const p of config.android.blockedPermissions) expect(doc).toContain(p.replace('android.permission.', ''));
  });
});

describe('plan checklist (§17)', () => {
  const lines = plan.split('\n').filter((l) => /^- \[[ x]\] \*\*D\d+/.test(l));

  it('has the nine days and the closed-testing line', () => {
    expect(lines).toHaveLength(10);
  });

  it('ticks D1 to D8 only, and notes inline what a device or an account is still needed for', () => {
    for (const line of lines) {
      const day = Number(/\*\*D(\d+)/.exec(line)![1]);
      if (day <= 8) {
        expect(line.startsWith('- [x]')).toBe(true);
        expect(line).toMatch(/device|jest|not (?:done|seen|added|built|measured)|never|account|nothing was/i);
      } else {
        expect(line.startsWith('- [ ]')).toBe(true);
      }
    }
  });

  it('does not claim a physical phone was used', () => {
    const d1 = lines.find((l) => /\*\*D1 /.test(l))!;
    expect(d1).toMatch(/not done/);
    expect(d1).toMatch(/needs a device and an EAS account/);
  });

  it('admits that the content was not fact-checked', () => {
    const d2 = lines.find((l) => /\*\*D2 /.test(l))!;
    expect(d2).toMatch(/nothing was fact-checked/);
  });
});
