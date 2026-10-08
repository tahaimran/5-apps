export type Vendor = 'samsung' | 'xiaomi' | 'huawei' | 'oneplus' | 'oppo' | 'google' | 'other';

/** The vendor group whose battery instructions apply (plan §5.6), from `Device.manufacturer`. */
export function vendorOf(manufacturer: string | null | undefined): Vendor {
  const m = (manufacturer ?? '').toLowerCase();
  if (m.includes('samsung')) return 'samsung';
  if (/xiaomi|redmi|poco/.test(m)) return 'xiaomi';
  if (/huawei|honor/.test(m)) return 'huawei';
  if (m.includes('oneplus')) return 'oneplus';
  if (/oppo|vivo|realme/.test(m)) return 'oppo';
  if (/google|pixel/.test(m)) return 'google';
  return 'other';
}

/** The page on dontkillmyapp.com for a vendor (the home page for the others). */
export const dontKillMyAppUrl = (v: Vendor): string =>
  v === 'other' ? 'https://dontkillmyapp.com/' : `https://dontkillmyapp.com/${v === 'oppo' ? 'oppo' : v}`;
