import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { API_BASE_URL } from '../config/env';
import { PartnerLifecycleState } from './authSlice';

export interface PartnerAuthResponse {
  accessToken: string;
  refreshToken: string;
  isNewUser: boolean;
  lifecycleState: PartnerLifecycleState;
}

// Matches auth-service's GlobalExceptionHandler ApiResponse.error() envelope —
// { success:false, message, timestamp } — returned for every non-2xx response
// from the partner auth endpoints (validation, lockout, expired/incorrect OTP).
export interface ApiErrorBody {
  success: false;
  message: string;
  timestamp: string;
}

export const authApi = createApi({
  reducerPath: 'authApi',
  baseQuery: fetchBaseQuery({ baseUrl: `${API_BASE_URL}/api/auth/partner` }),
  endpoints: (builder) => ({
    // FR-1.4/FR-1.5 — Phase 1: OTP is hardcoded to 1234 server-side, no SMS sent.
    sendOtp: builder.mutation<void, { phone: string }>({
      query: (body) => ({ url: '/send-otp', method: 'POST', body }),
    }),
    // FR-1.6-1.10 — returns tokens + lifecycleState on success.
    verifyOtp: builder.mutation<PartnerAuthResponse, { phone: string; otp: string }>({
      query: (body) => ({ url: '/verify-otp', method: 'POST', body }),
    }),
  }),
});

export const { useSendOtpMutation, useVerifyOtpMutation } = authApi;

/** Pulls the backend's human-readable message out of an RTK Query error, e.g.
 * "Account locked due to too many attempts. Try again in 10 minutes." */
export function extractApiErrorMessage(error: unknown, fallback: string): string {
  if (error && typeof error === 'object' && 'data' in error) {
    const data = (error as { data?: unknown }).data;
    if (data && typeof data === 'object' && 'message' in data) {
      const message = (data as { message?: unknown }).message;
      if (typeof message === 'string' && message.length > 0) return message;
    }
  }
  return fallback;
}
