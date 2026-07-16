import React from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../navigation/types';
import PlaceholderScreen from '../components/PlaceholderScreen';

type Props = NativeStackScreenProps<AuthStackParamList, 'Registration'>;

// Stub for the M2 Registration flow — reached when FR-1.10 routes a
// never-before-seen number here after OTP verification.
export default function RegistrationScreen({ route }: Props) {
  return (
    <PlaceholderScreen
      emoji="📝"
      title="Registration"
      subtitle={`Let's get ${route.params.mobile} set up. The registration form (M2) is coming soon.`}
    />
  );
}
