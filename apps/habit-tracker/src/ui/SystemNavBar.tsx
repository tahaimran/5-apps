import { requireOptionalNativeModule } from 'expo';

/** Present only in builds made after expo-navigation-bar was added; older dev builds lack it. */
const available = requireOptionalNativeModule('ExpoNavigationBar') !== null;
const NavigationBar = available
  ? (require('expo-navigation-bar') as typeof import('expo-navigation-bar')).NavigationBar
  : null;

/** Light or dark system navigation buttons, following the in-app theme. */
export function SystemNavBar({ dark }: { dark: boolean }) {
  return NavigationBar ? <NavigationBar style={dark ? 'light' : 'dark'} /> : null;
}
