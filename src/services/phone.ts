// FR-1.2/FR-1.3: a valid Indian mobile number — 10 digits, starting 6-9.
// Mirrors the backend's `\+91[6-9]\d{9}` validation exactly.
const INDIAN_MOBILE_REGEX = /^[6-9]\d{9}$/;

export function isValidIndianMobile(tenDigitPhone: string): boolean {
  return INDIAN_MOBILE_REGEX.test(tenDigitPhone);
}

/** "9876543210" -> "+919876543210", the shape auth-service expects. */
export function toE164(tenDigitPhone: string): string {
  return `+91${tenDigitPhone}`;
}
