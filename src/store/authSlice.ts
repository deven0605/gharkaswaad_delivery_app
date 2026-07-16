import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// Mirrors com.thalicloud.auth.enums.PartnerLifecycleState
export type PartnerLifecycleState = 'PENDING_VERIFICATION' | 'APPROVED' | 'SUSPENDED';

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  phone: string | null;
  lifecycleState: PartnerLifecycleState | null;
}

const initialState: AuthState = {
  accessToken: null,
  refreshToken: null,
  phone: null,
  lifecycleState: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials(
      state,
      action: PayloadAction<{
        accessToken: string;
        refreshToken: string;
        phone: string;
        lifecycleState: PartnerLifecycleState;
      }>
    ) {
      state.accessToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
      state.phone = action.payload.phone;
      state.lifecycleState = action.payload.lifecycleState;
    },
    clearCredentials(state) {
      state.accessToken = null;
      state.refreshToken = null;
      state.phone = null;
      state.lifecycleState = null;
    },
  },
});

export const { setCredentials, clearCredentials } = authSlice.actions;
export default authSlice.reducer;
