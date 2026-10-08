import { applyVisibleReorder, moveInOrder } from '../reorder';

describe('applyVisibleReorder', () => {
  it('reorders when everything is visible', () => {
    expect(applyVisibleReorder(['a', 'b', 'c'], ['a', 'b', 'c'], 0, 2)).toEqual(['b', 'c', 'a']);
    expect(applyVisibleReorder(['a', 'b', 'c'], ['a', 'b', 'c'], 2, 0)).toEqual(['c', 'a', 'b']);
  });
  it('keeps hidden habits in their slots', () => {
    // b is hidden today; dragging c above a
    expect(applyVisibleReorder(['a', 'b', 'c'], ['a', 'c'], 1, 0)).toEqual(['c', 'b', 'a']);
  });
  it('ignores no-op and out-of-range drags', () => {
    const order = ['a', 'b'];
    expect(applyVisibleReorder(order, order, 1, 1)).toBe(order);
    expect(applyVisibleReorder(order, order, 0, 5)).toBe(order);
    expect(applyVisibleReorder(order, order, -1, 0)).toBe(order);
  });
});

describe('moveInOrder', () => {
  it('moves up and down', () => {
    expect(moveInOrder(['a', 'b', 'c'], 'b', -1)).toEqual(['b', 'a', 'c']);
    expect(moveInOrder(['a', 'b', 'c'], 'b', 1)).toEqual(['a', 'c', 'b']);
  });
  it('stops at the ends and for unknown ids', () => {
    const order = ['a', 'b'];
    expect(moveInOrder(order, 'a', -1)).toBe(order);
    expect(moveInOrder(order, 'b', 1)).toBe(order);
    expect(moveInOrder(order, 'zzz', 1)).toBe(order);
  });
});
