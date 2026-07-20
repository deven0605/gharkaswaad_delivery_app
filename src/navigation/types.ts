export type AuthStackParamList = {
  Splash: undefined;
  Login: { mode?: 'register' | 'login' } | undefined;
  VerifyOtp: { mobile: string; mode?: 'register' | 'login' };
  // M2 Registration & KYC Onboarding (S04-S07) — a flat 4-step wizard, entered
  // once via FR-1.10 for a brand-new number.
  PersonalDetails: { mobile: string };
  VehicleDetails: undefined;
  DocumentUpload: undefined;
  BankDetails: undefined;
  // S08 — "Application Under Review" (M2.5). FR-1.10 post-verify destination
  // for PENDING_VERIFICATION, and also the FR-2.9 destination after submit.
  UnderReview: undefined;
  Home: undefined;
};
