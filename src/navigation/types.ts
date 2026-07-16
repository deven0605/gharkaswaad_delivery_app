export type AuthStackParamList = {
  Splash: undefined;
  Login: { mode?: 'register' | 'login' } | undefined;
  VerifyOtp: { mobile: string; mode?: 'register' | 'login' };
  // FR-1.10 post-verify destinations — stub screens until M2/M3/M4 are built.
  Registration: { mobile: string };
  UnderReview: undefined;
  Home: undefined;
};
