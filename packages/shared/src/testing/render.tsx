import type { ReactElement } from 'react';
import { act } from 'react';
import TestRenderer, { type ReactTestInstance } from 'react-test-renderer';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const mounted: TestRenderer.ReactTestRenderer[] = [];

export async function cleanup() {
  await act(async () => {
    while (mounted.length) mounted.pop()!.unmount();
  });
}

const matches = (value: unknown, label: string | RegExp) =>
  typeof value === 'string' && (typeof label === 'string' ? value === label : label.test(value));

const flatText = (node: ReactTestInstance): string =>
  node.children.map((c) => (typeof c === 'string' ? c : flatText(c))).join('');

export interface Rendered {
  root: ReactTestInstance;
  texts: () => string[];
  byLabel: (label: string | RegExp) => ReactTestInstance[];
  press: (label: string | RegExp) => Promise<void>;
  update: (element: ReactElement) => Promise<void>;
  json: () => unknown;
}

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
    update: async (next) => {
      await act(async () => {
        renderer.update(next);
      });
    },
    json: () => renderer.toJSON(),
  };
}
