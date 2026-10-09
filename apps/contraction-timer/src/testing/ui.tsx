import type { ReactElement } from 'react';
import { act } from 'react';
import TestRenderer, { type ReactTestInstance } from 'react-test-renderer';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const mounted: TestRenderer.ReactTestRenderer[] = [];

/** Unmounts everything rendered so far (call in afterEach). */
export async function cleanup() {
  await act(async () => {
    while (mounted.length) mounted.pop()!.unmount();
  });
}

export interface Rendered {
  root: ReactTestInstance;
  /** Every host text rendered, in order. */
  texts: () => string[];
  /** Elements whose accessibilityLabel matches exactly. */
  byLabel: (label: string | RegExp) => ReactTestInstance[];
  /** Presses the first pressable with that accessibilityLabel (or throws). */
  press: (label: string | RegExp) => Promise<void>;
  type: (label: string, text: string) => Promise<void>;
  /** Re-renders the same tree with new props (keeps component state). */
  update: (element: ReactElement) => Promise<void>;
  unmount: () => void;
}

const matches = (value: unknown, label: string | RegExp) =>
  typeof value === 'string' && (typeof label === 'string' ? value === label : label.test(value));

const flatText = (node: ReactTestInstance): string => {
  const parts: string[] = [];
  for (const child of node.children) parts.push(typeof child === 'string' ? child : flatText(child));
  return parts.join('');
};

export async function render(element: ReactElement): Promise<Rendered> {
  let renderer!: TestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = TestRenderer.create(element);
  });
  mounted.push(renderer);
  const root = renderer.root;
  const byLabel = (label: string | RegExp) =>
    root.findAll((n) => typeof n.type === 'string' && matches(n.props.accessibilityLabel, label));
  return {
    root,
    texts: () => root.findAll((n) => (n.type as unknown) === 'Text').map(flatText),
    byLabel,
    press: async (label) => {
      const target = root.findAll((n) => typeof n.props.onPress === 'function' && matches(n.props.accessibilityLabel, label) && !n.props.disabled)[0];
      if (!target) throw new Error(`No pressable labelled ${String(label)}`);
      await act(async () => {
        target.props.onPress({ nativeEvent: {} });
      });
    },
    type: async (label, text) => {
      const input = root.findAll((n) => typeof n.props.onChangeText === 'function' && matches(n.props.accessibilityLabel, label))[0];
      if (!input) throw new Error(`No input labelled ${label}`);
      await act(async () => {
        input.props.onChangeText(text);
      });
    },
    update: async (next) => {
      await act(async () => {
        renderer.update(next);
      });
    },
    unmount: () => renderer.unmount(),
  };
}

export const flush = () => act(async () => {});


/** Plan §7.3: buttons and rows are at least 56dp. */
export const MIN_TARGET_DP = 56;

/**
 * Grid cells are the one exception: the plan sets their floor at 44dp (cells shrink with the grid
 * size) and a test in the grid suite checks that floor separately. They carry a `cell-` testID.
 */
const isGridCell = (n: ReactTestInstance) => typeof n.props.testID === 'string' && n.props.testID.startsWith('cell-');

/** RN wraps Pressable in memo/forwardRef, so match by name rather than identity. */
export const isPressable = (n: ReactTestInstance) => {
  const t = n.type as unknown as { displayName?: string; name?: string } | string;
  return typeof t !== 'string' && (t.displayName === 'Pressable' || t.name === 'Pressable');
};

/**
 * Touch-target and label audit of a rendered tree. Returns human-readable problems: a Pressable
 * with an explicit width or height under 56dp (a larger minWidth/minHeight is fine), or no
 * accessibility label.
 */
export function auditPressables(root: ReactTestInstance): string[] {
  const { StyleSheet } = require('react-native') as typeof import('react-native');
  const problems: string[] = [];
  const pressables = root.findAll((n) => isPressable(n));
  for (const node of pressables) {
    if (isGridCell(node)) continue;
    const label = node.props.accessibilityLabel as string | undefined;
    const hidden = node.props.accessible === false || node.props.importantForAccessibility === 'no' || node.props.importantForAccessibility === 'no-hide-descendants';
    const name = label ?? '(no label)';
    if (!label && !hidden) problems.push(`Pressable without label`);
    if (hidden) continue;
    const raw = node.props.style;
    const style = StyleSheet.flatten(typeof raw === 'function' ? raw({ pressed: false }) : raw) ?? {};
    const small = (size: unknown, min: unknown) => typeof size === 'number' && size < MIN_TARGET_DP && !(typeof min === 'number' && min >= MIN_TARGET_DP);
    if (small(style.height, style.minHeight)) problems.push(`"${name}" is ${String(style.height)}dp tall`);
    if (small(style.width, style.minWidth)) problems.push(`"${name}" is ${String(style.width)}dp wide`);
  }
  return problems;
}
