import { optional } from '../optional';

describe('optional native modules', () => {
  it('returns the module when it loads', () => {
    expect(optional(() => ({ manufacturer: 'Xiaomi' }))).toEqual({ manufacturer: 'Xiaomi' });
  });
  it('returns null instead of throwing when the native side is missing from this build', () => {
    expect(
      optional(() => {
        throw new Error("Cannot find native module 'ExpoDevice'");
      }),
    ).toBeNull();
  });
});
