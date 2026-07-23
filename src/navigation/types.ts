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
  // M5 Pickup Navigation & Verification (S12/S13) — reached from Home's Active
  // Delivery card or STOMP offer-accept; both screens read the current
  // assignment themselves via getCurrentAssignment, so no params needed.
  PickupNavigation: undefined;
  PickupVerification: undefined;
  // M6 Drop Navigation & Delivery Confirmation (S14/S15/S16) — same
  // no-params convention as M5.
  DropNavigation: undefined;
  DeliveryVerification: undefined;
  DeliveryCompleted: { payoutPaise: number; dropLocality: string };
  // S17 — Earnings Dashboard (M8.1/FR-8.1-8.3), including the M7/FR-7.3-7.4
  // Cash in Hand + remittance flow.
  Earnings: undefined;
  // S18 — Payout History (M8.2/FR-8.4/FR-8.5).
  PayoutHistory: undefined;
  // M9 — Delivery History (FR-9.1-FR-9.3).
  DeliveryHistory: undefined;
  DeliveryHistoryDetail: { assignmentId: string };
  // M10 — Ratings & Feedback (FR-10.2).
  RatingsFeedback: undefined;
  // M11 — Profile & Documents (FR-11.1-FR-11.4). Profile/Documents are tabs
  // within one screen (FR-11.2: "Documents tab"); bank/UPI editing (FR-11.4)
  // is its own screen, same as the onboarding BankDetails step.
  Profile: undefined;
  EditBankDetails: undefined;
  // M12 — Notifications (FR-12.2/FR-12.3).
  Notifications: undefined;
  // M13 — Help & Support (FR-13.1/FR-13.2).
  HelpSupport: undefined;
};
