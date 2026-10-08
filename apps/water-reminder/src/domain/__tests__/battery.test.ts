import { dontKillMyAppUrl, vendorOf } from '../battery';

describe('vendorOf', () => {
  it.each([
    ['samsung', 'samsung'],
    ['Samsung', 'samsung'],
    ['Xiaomi', 'xiaomi'],
    ['Redmi', 'xiaomi'],
    ['POCO', 'xiaomi'],
    ['HUAWEI', 'huawei'],
    ['HONOR', 'huawei'],
    ['OnePlus', 'oneplus'],
    ['OPPO', 'oppo'],
    ['vivo', 'oppo'],
    ['realme', 'oppo'],
    ['Google', 'google'],
    ['Motorola', 'other'],
    [null, 'other'],
    [undefined, 'other'],
    ['', 'other'],
  ])('%s → %s', (m, vendor) => {
    expect(vendorOf(m)).toBe(vendor);
  });
  it('links to the matching dontkillmyapp.com page', () => {
    expect(dontKillMyAppUrl('samsung')).toBe('https://dontkillmyapp.com/samsung');
    expect(dontKillMyAppUrl('other')).toBe('https://dontkillmyapp.com/');
  });
});
