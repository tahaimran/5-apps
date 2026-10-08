/** RELEASE.md must stay honest: nothing is claimed as done on a device. */
import * as fs from 'fs';
import * as path from 'path';

const doc = fs.readFileSync(path.resolve(__dirname, '../../RELEASE.md'), 'utf8');

describe('RELEASE.md', () => {
  it('says plainly that nothing was run on a device', () => {
    expect(doc).toMatch(/Nothing in this app has been run on a device or an emulator/);
  });
  it('leaves every device QA row open', () => {
    const section = doc.split('## 4. Device QA matrix')[1].split('## 5.')[0];
    const rows = section.split('\n').filter((l) => l.startsWith('| ') && !l.startsWith('| Area') && !l.startsWith('|---'));
    expect(rows.length).toBeGreaterThan(20);
    for (const row of rows) expect(row.trim().endsWith('| open |')).toBe(true);
  });
  it('lists the plan checklist areas it cannot verify without a phone', () => {
    for (const word of ['Doze', 'Reboot', 'killed', 'TalkBack', '16 KB', 'UMP', 'Samsung', 'Xiaomi', 'Pixel 8']) expect(doc).toContain(word);
  });
  it('mentions the misfiled ASO description', () => {
    expect(doc).toMatch(/Quizora/);
  });
});
