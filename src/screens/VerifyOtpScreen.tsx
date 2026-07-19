import React, { useState } from 'react';
import { ActivityIndicator, ImageBackground, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Colors } from '../theme/colors';
import { commonStyles, SW } from '../theme/styles';
import { AuthStackParamList } from '../navigation/types';
import { ArrowRightIcon, BowlPlantIcon, ClockIcon, CloudIcon, HelpBubbleIcon, LeafIcon, SpoonWatermarkIcon } from '../components/Icons';
import CityscapeIllustration from '../components/CityscapeIllustration';
import BackButton from '../components/BackButton';
import OtpRiderBadge from '../components/OtpRiderBadge';
import OtpInput from '../components/OtpInput';
import { formatCountdown, useCountdown } from '../hooks/useCountdown';
import { useSendOtpMutation, useVerifyOtpMutation, extractApiErrorMessage } from '../store/authApi';
import { toE164 } from '../services/phone';
import { saveTokens } from '../services/tokenStorage';
import { useAppDispatch } from '../store/hooks';
import { setCredentials } from '../store/authSlice';

type Props = NativeStackScreenProps<AuthStackParamList, 'VerifyOtp'>;

const OTP_LENGTH = 4;
const RESEND_SECONDS = 30; // FR-1.7

function formatMobile(mobile: string): string {
  return `+91 ${mobile.slice(0, 5)} ${mobile.slice(5)}`;
}

// S03 — Verify OTP. Reached from the Login screen after "Send OTP".
export default function VerifyOtpScreen({ navigation, route }: Props) {
  const { mobile } = route.params;
  const [otp, setOtp] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [resendNotice, setResendNotice] = useState<string | null>(null);
  const { secondsLeft, isActive, restart } = useCountdown(RESEND_SECONDS);
  const isComplete = otp.length === OTP_LENGTH;
  const dispatch = useAppDispatch();

  const [verifyOtp, { isLoading: isVerifying }] = useVerifyOtpMutation();
  const [sendOtp, { isLoading: isResending }] = useSendOtpMutation();

  const handleVerify = async () => {
    if (!isComplete || isVerifying) return;
    setError(null);
    try {
      // FR-1.8 — accessToken/refreshToken + lifecycleState on correct OTP.
      const response = await verifyOtp({ phone: toE164(mobile), otp }).unwrap();

      // FR-1.11 — tokens go straight into Keychain/Keystore, never app state alone.
      await saveTokens(response.accessToken, response.refreshToken);
      dispatch(
        setCredentials({
          accessToken: response.accessToken,
          refreshToken: response.refreshToken,
          phone: mobile,
          lifecycleState: response.lifecycleState,
        })
      );

      // FR-1.10 — route by isNewUser / lifecycleState, replacing the auth
      // stack so the back button can't return to Login/VerifyOtp.
      if (response.isNewUser) {
        navigation.reset({ index: 0, routes: [{ name: 'PersonalDetails', params: { mobile } }] });
      } else if (response.lifecycleState === 'PENDING_VERIFICATION') {
        navigation.reset({ index: 0, routes: [{ name: 'UnderReview' }] });
      } else {
        navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
      }
    } catch (err) {
      // FR-1.9 — incorrect OTP / lockout messages surface here verbatim.
      setError(extractApiErrorMessage(err, 'Could not verify OTP. Please try again.'));
      setOtp('');
    }
  };

  const handleResend = async () => {
    if (isActive || isResending) return;
    setError(null);
    setResendNotice(null);
    try {
      await sendOtp({ phone: toE164(mobile) }).unwrap();
      setOtp('');
      restart();
      setResendNotice('OTP resent successfully.');
    } catch (err) {
      setError(extractApiErrorMessage(err, 'Could not resend OTP. Please try again.'));
    }
  };

  return (
    <ImageBackground
      source={require('../../assets/images/bg-pattern.png')}
      style={styles.root}
      resizeMode="cover"
    >
      <StatusBar style="dark" />

      <SafeAreaView style={commonStyles.safe}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <BackButton onPress={() => navigation.goBack()} />

          <View style={styles.heroWrap}>
            <View style={[styles.watermark, styles.watermarkTopLeft]}>
              <BowlPlantIcon size={54} />
            </View>
            <View style={[styles.watermark, styles.watermarkTopRight]}>
              <SpoonWatermarkIcon size={54} />
            </View>
            <View style={[styles.watermark, styles.watermarkBottomLeft]}>
              <LeafIcon size={20} color={Colors.brandGreenMuted} />
            </View>
            <View style={[styles.watermark, styles.watermarkBottomRight]}>
              <LeafIcon size={20} color={Colors.brandGreenMuted} />
            </View>
            <View style={[styles.watermark, styles.watermarkCloud]}>
              <CloudIcon size={30} />
            </View>

            <OtpRiderBadge />
          </View>

          <View style={styles.titleRow}>
            <Text style={styles.titleVerify}>Verify </Text>
            <Text style={styles.titleOtp}>OTP</Text>
          </View>
          <Text style={styles.subtitle}>
            Sent to <Text style={styles.subtitleBold}>{formatMobile(mobile)}</Text>
          </Text>

          <View style={styles.otpWrap}>
            <OtpInput
              length={OTP_LENGTH}
              value={otp}
              onChange={(value) => {
                setOtp(value);
                setError(null);
              }}
              autoFocus
            />
          </View>

          {error && <Text style={styles.errorText}>{error}</Text>}
          {!error && resendNotice && <Text style={styles.noticeText}>{resendNotice}</Text>}

          {isActive && (
            <View style={styles.timerRow}>
              <ClockIcon size={16} />
              <Text style={styles.timerText}>
                Resend OTP in <Text style={styles.timerValue}>{formatCountdown(secondsLeft)}</Text>
              </Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles.verifyBtn, (!isComplete || isVerifying) && styles.verifyBtnDisabled]}
            activeOpacity={0.85}
            disabled={!isComplete || isVerifying}
            onPress={handleVerify}
          >
            {isVerifying ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <>
                <Text style={styles.verifyBtnText}>Verify</Text>
                <ArrowRightIcon size={18} color={Colors.white} />
              </>
            )}
          </TouchableOpacity>

          <View style={styles.orRow}>
            <View style={styles.orLine} />
            <Text style={styles.orText}>OR</Text>
            <View style={styles.orLine} />
          </View>

          <TouchableOpacity
            style={styles.footerCard}
            activeOpacity={isActive || isResending ? 1 : 0.7}
            disabled={isActive || isResending}
            onPress={handleResend}
          >
            <View style={styles.footerIconWrap}>
              {isResending ? (
                <ActivityIndicator color={Colors.white} size="small" />
              ) : (
                <HelpBubbleIcon size={22} color={Colors.white} />
              )}
            </View>
            <View style={styles.footerTextWrap}>
              <Text style={styles.footerTitle}>Didn&apos;t receive OTP?</Text>
              <Text style={[styles.footerSubtext, !isActive && styles.footerSubtextActive]}>
                {isActive ? 'Resend (disabled)' : isResending ? 'Resending…' : 'Resend OTP'}
              </Text>
            </View>
          </TouchableOpacity>

          <CityscapeIllustration />
        </ScrollView>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.cream,
  },
  scrollContent: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 8,
  },

  heroWrap: {
    width: SW,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  watermark: {
    position: 'absolute',
  },
  watermarkTopLeft: {
    left: 20,
    top: 6,
  },
  watermarkTopRight: {
    right: 16,
    top: 0,
  },
  watermarkBottomLeft: {
    left: 34,
    bottom: 10,
  },
  watermarkBottomRight: {
    right: 34,
    bottom: 10,
  },
  watermarkCloud: {
    left: 12,
    bottom: 34,
  },

  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  titleVerify: {
    fontSize: 30,
    fontWeight: '800',
    color: Colors.brandGreen,
  },
  titleOtp: {
    fontSize: 30,
    fontWeight: '800',
    color: Colors.primary,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 4,
    marginBottom: 22,
  },
  subtitleBold: {
    fontWeight: '700',
    color: Colors.brandGreen,
  },

  otpWrap: {
    width: SW - 48,
  },

  errorText: {
    width: SW - 48,
    color: Colors.error,
    fontSize: 13,
    marginTop: 14,
    textAlign: 'center',
  },
  noticeText: {
    width: SW - 48,
    color: Colors.brandGreen,
    fontSize: 13,
    marginTop: 14,
    textAlign: 'center',
  },

  timerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 18,
  },
  timerText: {
    fontSize: 14,
    color: Colors.textPrimary,
  },
  timerValue: {
    fontWeight: '700',
    color: Colors.primary,
  },

  verifyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    width: SW - 48,
    backgroundColor: Colors.primary,
    borderRadius: 16,
    paddingVertical: 16,
    marginTop: 20,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  verifyBtnDisabled: {
    opacity: 0.5,
  },
  verifyBtnText: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.white,
  },

  orRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: SW - 48,
    marginTop: 20,
    marginBottom: 16,
  },
  orLine: {
    flex: 1,
    height: 0,
    borderTopWidth: 1,
    borderStyle: 'dashed',
    borderColor: Colors.border,
  },
  orText: {
    marginHorizontal: 14,
    color: Colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },

  footerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    width: SW - 48,
    backgroundColor: Colors.footerBg,
    borderRadius: 16,
    padding: 14,
    marginBottom: 18,
  },
  footerIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.brandGreen,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  footerTextWrap: {
    flex: 1,
  },
  footerTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  footerSubtext: {
    fontSize: 12.5,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  footerSubtextActive: {
    color: Colors.primary,
    fontWeight: '700',
  },
});
