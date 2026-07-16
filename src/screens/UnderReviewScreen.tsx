import React from 'react';
import PlaceholderScreen from '../components/PlaceholderScreen';

// Stub — reached when FR-1.10 routes a PENDING_VERIFICATION partner here
// after OTP verification. The full review-status screen isn't built yet.
export default function UnderReviewScreen() {
  return (
    <PlaceholderScreen
      emoji="🕒"
      title="Under Review"
      subtitle="Your documents are being verified. We'll notify you once your account is approved."
    />
  );
}
