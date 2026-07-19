export type AuthStackParamList = {
  Splash: undefined;
  Login: { mode?: 'register' | 'login' } | undefined;
  VerifyOtp: { mobile: string; mode?: 'register' | 'login' };
  // M2 Registration & KYC Onboarding (S04-S06) — a flat 3-step wizard, entered
  // once via FR-1.10 for a brand-new number.
  PersonalDetails: { mobile: string };
  VehicleDetails: undefined;
  DocumentUpload: undefined;
  // FR-1.10 post-verify destination for PENDING_VERIFICATION — stub until M3/M4.
  UnderReview: undefined;
  Home: undefined;
};
