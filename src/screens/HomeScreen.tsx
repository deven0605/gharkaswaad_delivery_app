import React from 'react';
import { useAppSelector } from '../store/hooks';
import PlaceholderScreen from '../components/PlaceholderScreen';

// Stub — reached when FR-1.10 routes an APPROVED or SUSPENDED partner here
// after OTP verification. The full Home Dashboard (M4) isn't built yet.
export default function HomeScreen() {
  const lifecycleState = useAppSelector((state) => state.auth.lifecycleState);

  return lifecycleState === 'SUSPENDED' ? (
    <PlaceholderScreen
      emoji="⛔"
      title="Account Suspended"
      subtitle="Your account has been suspended. Contact support for more details."
    />
  ) : (
    <PlaceholderScreen
      emoji="🏠"
      title="Home Dashboard"
      subtitle="You're logged in! The full Home Dashboard (M4) is coming soon."
    />
  );
}
