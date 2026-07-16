import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

// FR-1.11: accessToken/refreshToken live in Keychain (iOS) / Keystore-backed
// EncryptedSharedPreferences (Android) via expo-secure-store, never AsyncStorage.
// expo-secure-store has no web implementation — this app's target platforms
// are Android/iOS, so web silently no-ops here instead of throwing.
const ACCESS_TOKEN_KEY = 'partner_access_token';
const REFRESH_TOKEN_KEY = 'partner_refresh_token';

export async function saveTokens(accessToken: string, refreshToken: string): Promise<void> {
  if (Platform.OS === 'web') return;
  await Promise.all([
    SecureStore.setItemAsync(ACCESS_TOKEN_KEY, accessToken),
    SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken),
  ]);
}

export async function loadTokens(): Promise<{ accessToken: string; refreshToken: string } | null> {
  if (Platform.OS === 'web') return null;
  const [accessToken, refreshToken] = await Promise.all([
    SecureStore.getItemAsync(ACCESS_TOKEN_KEY),
    SecureStore.getItemAsync(REFRESH_TOKEN_KEY),
  ]);
  if (!accessToken || !refreshToken) return null;
  return { accessToken, refreshToken };
}

export async function clearTokens(): Promise<void> {
  if (Platform.OS === 'web') return;
  await Promise.all([
    SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY),
    SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY),
  ]);
}
