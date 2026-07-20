import { Platform } from 'react-native';

// Spring Cloud Gateway — fronts auth-service and every other backend service.
// - Android emulator can't resolve the host machine's "localhost"; 10.0.2.2 is
//   the documented alias for it.
// - iOS simulator and web both share the host's network stack, so "localhost"
//   resolves directly.
// - A physical device needs the dev machine's LAN IP — override via
//   EXPO_PUBLIC_API_BASE_URL in that case (e.g. EXPO_PUBLIC_API_BASE_URL=http://192.168.1.20:8080).
const DEFAULT_GATEWAY_URL = Platform.OS === 'android' ? 'http://192.168.1.10:8080' : 'http://localhost:8080';

export const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? DEFAULT_GATEWAY_URL;

// FR-3.3 — STOMP-over-WebSocket endpoint, proxied through the same gateway
// (gateway-service's /ws/** route forwards to delivery-service). Same host,
// ws(s) scheme instead of http(s).
export const WS_BASE_URL = `${API_BASE_URL.replace(/^http/, 'ws')}/ws`;
