import { Linking, Platform } from 'react-native';

/**
 * FR-5.2/FR-6.2 — deep-links to the native maps app for turn-by-turn
 * navigation. Tries the platform's native scheme first (Apple Maps on iOS,
 * Google Maps app on Android); `Linking.canOpenURL` is unreliable for these
 * custom schemes on Android 11+ (package-visibility restrictions can report
 * false negatives), so this just attempts the native URL and falls back to
 * the universal Google Maps web URL on failure rather than pre-checking.
 */
export async function openNavigation(latitude: number, longitude: number): Promise<void> {
  const nativeUrl = Platform.OS === 'ios'
    ? `maps://app?daddr=${latitude},${longitude}&dirflg=d`
    : `google.navigation:q=${latitude},${longitude}&mode=d`;
  const webUrl = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}&travelmode=driving`;

  try {
    await Linking.openURL(nativeUrl);
  } catch {
    await Linking.openURL(webUrl);
  }
}

/** FR-5.3/FR-6.2 — "Call Kitchen"/"Call Customer", both masked/proxy numbers. */
export async function callNumber(phone: string): Promise<void> {
  await Linking.openURL(`tel:${phone}`);
}
