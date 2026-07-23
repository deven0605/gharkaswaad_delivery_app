import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthStackParamList } from './types';
import SplashScreen from '../screens/SplashScreen';
import LoginScreen from '../screens/LoginScreen';
import VerifyOtpScreen from '../screens/VerifyOtpScreen';
import PersonalDetailsScreen from '../screens/PersonalDetailsScreen';
import VehicleDetailsScreen from '../screens/VehicleDetailsScreen';
import DocumentUploadScreen from '../screens/DocumentUploadScreen';
import BankDetailsScreen from '../screens/BankDetailsScreen';
import UnderReviewScreen from '../screens/UnderReviewScreen';
import HomeScreen from '../screens/HomeScreen';
import PickupNavigationScreen from '../screens/PickupNavigationScreen';
import PickupVerificationScreen from '../screens/PickupVerificationScreen';
import DropNavigationScreen from '../screens/DropNavigationScreen';
import DeliveryVerificationScreen from '../screens/DeliveryVerificationScreen';
import DeliveryCompletedScreen from '../screens/DeliveryCompletedScreen';
import EarningsScreen from '../screens/EarningsScreen';
import PayoutHistoryScreen from '../screens/PayoutHistoryScreen';
import DeliveryHistoryScreen from '../screens/DeliveryHistoryScreen';
import DeliveryHistoryDetailScreen from '../screens/DeliveryHistoryDetailScreen';
import RatingsFeedbackScreen from '../screens/RatingsFeedbackScreen';
import ProfileScreen from '../screens/ProfileScreen';
import EditBankDetailsScreen from '../screens/EditBankDetailsScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import HelpSupportScreen from '../screens/HelpSupportScreen';

const Stack = createNativeStackNavigator<AuthStackParamList>();

export default function AuthNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Splash" component={SplashScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="VerifyOtp" component={VerifyOtpScreen} />
      <Stack.Screen name="PersonalDetails" component={PersonalDetailsScreen} />
      <Stack.Screen name="VehicleDetails" component={VehicleDetailsScreen} />
      <Stack.Screen name="DocumentUpload" component={DocumentUploadScreen} />
      <Stack.Screen name="BankDetails" component={BankDetailsScreen} />
      <Stack.Screen name="UnderReview" component={UnderReviewScreen} />
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="PickupNavigation" component={PickupNavigationScreen} />
      <Stack.Screen name="PickupVerification" component={PickupVerificationScreen} />
      <Stack.Screen name="DropNavigation" component={DropNavigationScreen} />
      <Stack.Screen name="DeliveryVerification" component={DeliveryVerificationScreen} />
      <Stack.Screen name="DeliveryCompleted" component={DeliveryCompletedScreen} />
      <Stack.Screen name="Earnings" component={EarningsScreen} />
      <Stack.Screen name="PayoutHistory" component={PayoutHistoryScreen} />
      <Stack.Screen name="DeliveryHistory" component={DeliveryHistoryScreen} />
      <Stack.Screen name="DeliveryHistoryDetail" component={DeliveryHistoryDetailScreen} />
      <Stack.Screen name="RatingsFeedback" component={RatingsFeedbackScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="EditBankDetails" component={EditBankDetailsScreen} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
      <Stack.Screen name="HelpSupport" component={HelpSupportScreen} />
    </Stack.Navigator>
  );
}
