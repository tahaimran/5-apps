/**
 * Source-level accessibility and copy rules from CLAUDE.md:
 *  - every interactive element has an accessibilityLabel,
 *  - nothing opts out of system font scaling,
 *  - user-facing strings live in en.json, not in JSX.
 */
import * as fs from 'fs';
import * as path from 'path';
import ts from 'typescript';

const ROOT = path.resolve(__dirname, '../..');
const DIRS = ['app', 'src'];

function files(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) return e.name === '__tests__' || e.name === 'testing' ? [] : files(full);
    return /\.tsx$/.test(e.name) ? [full] : [];
  });
}

interface Finding {
  file: string;
  line: number;
  what: string;
}

function scan(visit: (node: ts.Node, sf: ts.SourceFile, report: (n: ts.Node, what: string) => void) => void): Finding[] {
  const out: Finding[] = [];
  for (const dir of DIRS) {
    for (const file of files(path.join(ROOT, dir))) {
      const sf = ts.createSourceFile(file, fs.readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
      const report = (n: ts.Node, what: string) =>
        out.push({ file: path.relative(ROOT, file), line: sf.getLineAndCharacterOfPosition(n.getStart()).line + 1, what });
      const walk = (n: ts.Node) => {
        visit(n, sf, report);
        ts.forEachChild(n, walk);
      };
      walk(sf);
    }
  }
  return out;
}

const tagName = (n: ts.JsxOpeningLikeElement) => n.tagName.getText();
const attrs = (n: ts.JsxOpeningLikeElement) => n.attributes.properties;
const hasAttr = (n: ts.JsxOpeningLikeElement, name: string) =>
  attrs(n).some((a) => ts.isJsxAttribute(a) && a.name.getText() === name);
const hasSpread = (n: ts.JsxOpeningLikeElement) => attrs(n).some((a) => ts.isJsxSpreadAttribute(a));

/** Deliberately hidden from TalkBack because an accessible alternative covers the same action. */
const hiddenFromScreenReader = (n: ts.JsxOpeningLikeElement) =>
  attrs(n).some(
    (a) =>
      ts.isJsxAttribute(a) &&
      ((a.name.getText() === 'accessible' && a.initializer && /false/.test(a.initializer.getText())) ||
        (a.name.getText() === 'importantForAccessibility' && a.initializer && /"no(-hide-descendants)?"/.test(a.initializer.getText()))),
  );

const INTERACTIVE = new Set(['Pressable', 'TextInput', 'Switch', 'TouchableOpacity', 'TouchableHighlight']);

describe('accessibility rules', () => {
  it('labels every Pressable, TextInput and Switch', () => {
    const bad = scan((node, _sf, report) => {
      if ((ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) && INTERACTIVE.has(tagName(node))) {
        // Wrapper components forward a label prop; a spread may carry it.
        if (!hasAttr(node, 'accessibilityLabel') && !hasSpread(node) && !hiddenFromScreenReader(node)) report(node, `<${tagName(node)}> without accessibilityLabel`);
      }
    });
    expect(bad).toEqual([]);
  });

  it('never turns off font scaling', () => {
    const bad = scan((node, sf, report) => {
      if (ts.isJsxAttribute(node) && node.name.getText() === 'allowFontScaling') report(node, 'allowFontScaling is set');
      // Plan §7.2: only the grid letters are capped (1.4x), because the grid cell they sit in cannot grow.
      if (ts.isJsxAttribute(node) && node.name.getText() === 'maxFontSizeMultiplier' && !sf.fileName.endsWith(path.join('components', 'Grid.tsx'))) {
        report(node, 'maxFontSizeMultiplier caps the system font scale');
      }
    });
    expect(bad).toEqual([]);
  });

  it('keeps user-facing copy out of JSX (it belongs in en.json)', () => {
    const LETTERS = /\p{L}{2,}/u;
    const COPY_ATTRS = new Set(['accessibilityLabel', 'accessibilityHint', 'placeholder', 'title', 'label', 'dialogTitle']);
    const bad = scan((node, _sf, report) => {
      if (ts.isJsxText(node) && LETTERS.test(node.getText())) report(node, `text "${node.getText().trim()}"`);
      if (ts.isJsxAttribute(node) && COPY_ATTRS.has(node.name.getText()) && node.initializer && ts.isStringLiteral(node.initializer) && LETTERS.test(node.initializer.text)) {
        report(node, `${node.name.getText()}="${node.initializer.text}"`);
      }
    });
    expect(bad).toEqual([]);
  });
});
