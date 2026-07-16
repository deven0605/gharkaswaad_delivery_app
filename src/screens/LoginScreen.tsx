import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Image,
  ImageBackground,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Colors } from '../theme/colors';
import { commonStyles, SW } from '../theme/styles';
import { AuthStackParamList } from '../navigation/types';
import { ArrowRightIcon, ShieldCheckIcon, PersonIcon, ClipboardCheckIcon } from '../components/Icons';
import CityscapeIllustration from '../components/CityscapeIllustration';
import BackButton from '../components/BackButton';
import { useSendOtpMutation, extractApiErrorMessage } from '../store/authApi';
import { isValidIndianMobile, toE164 } from '../services/phone';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

const BANNER_W = SW * 0.46;
const BANNER_H = BANNER_W * 0.95;

// S02 — Login: Enter Mobile Number (M1.1). Reached via the Splash screen's
// "Get Started" / "Log In" actions.
export default function LoginScreen({ navigation, route }: Props) {
  const mode = route.params?.mode ?? 'register';
  const [phone, setPhone] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [sendOtp, { isLoading }] = useSendOtpMutation();

  // FR-1.3: only a full, correctly-shaped 10-digit number is submittable.
  const isValid = isValidIndianMobile(phone);
  const showFormatError = phone.length === 10 && !isValid;

  const handleSendOtp = async () => {
    if (!isValid || isLoading) return;
    setError(null);
    try {
      await sendOtp({ phone: toE164(phone) }).unwrap();
      navigation.navigate('VerifyOtp', { mobile: phone, mode });
    } catch (err) {
      setError(extractApiErrorMessage(err, 'Could not send OTP. Please check your connection and try again.'));
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

          <Image
            source={require('../../assets/images/scooter.png')}
            style={styles.banner}
            resizeMode="cover"
          />

          <View style={styles.titleRow}>
            <Text style={styles.titlePartner}>Partner </Text>
            <Text style={styles.titleLogin}>Login </Text>
            <Text style={styles.titleEmoji}>🛵</Text>
          </View>
          <Text style={styles.subtitle}>
            {mode === 'login' ? 'Enter your registered mobile number' : 'Enter your mobile number'}
          </Text>

          <View style={styles.inputRow}>
            <Text style={styles.countryCode}>+91</Text>
            <View style={styles.inputDivider} />
            <TextInput
              style={styles.phoneInput}
              placeholder="9876543210"
              placeholderTextColor={Colors.textSecondary}
              keyboardType="number-pad"
              maxLength={10}
              value={phone}
              onChangeText={(text) => {
                setPhone(text.replace(/[^0-9]/g, ''));
                setError(null);
              }}
            />
          </View>

          {showFormatError && (
            <Text style={styles.errorText}>Enter a valid 10-digit mobile number</Text>
          )}
          {error && <Text style={styles.errorText}>{error}</Text>}

          <View style={styles.infoBanner}>
            <View style={styles.infoIconWrap}>
              <ShieldCheckIcon size={16} />
            </View>
            <Text style={styles.infoText}>We&apos;ll send you an OTP to verify your number</Text>
          </View>

          <TouchableOpacity
            style={[styles.sendBtn, (!isValid || isLoading) && styles.sendBtnDisabled]}
            activeOpacity={0.85}
            disabled={!isValid || isLoading}
            onPress={handleSendOtp}
          >
            {isLoading ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <>
                <Text style={styles.sendBtnText}>Send OTP</Text>
                <ArrowRightIcon size={18} color={Colors.white} />
              </>
            )}
          </TouchableOpacity>

          <View style={styles.footerCard}>
            <View style={styles.footerLeft}>
              <View style={styles.footerIconWrap}>
                <PersonIcon size={18} />
              </View>
              <View style={styles.footerTextWrap}>
                <Text style={styles.footerTitle}>New partner?</Text>
                <Text style={styles.footerSubtext}>Registration starts after OTP verify.</Text>
              </View>
            </View>
            <ClipboardCheckIcon size={54} />
          </View>

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

  banner: {
    width: BANNER_W,
    height: BANNER_H,
    borderRadius: 20,
    marginBottom: 6,
  },

  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  titlePartner: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.brandGreen,
  },
  titleLogin: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.primary,
  },
  titleEmoji: {
    fontSize: 20,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 4,
    marginBottom: 18,
  },

  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: SW - 48,
    borderWidth: 1.4,
    borderColor: Colors.brandGreenMuted,
    borderRadius: 16,
    backgroundColor: Colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  countryCode: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  inputDivider: {
    width: 1,
    height: 22,
    backgroundColor: Colors.border,
    marginHorizontal: 12,
  },
  phoneInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.textPrimary,
    padding: 0,
  },

  errorText: {
    width: SW - 48,
    color: Colors.error,
    fontSize: 12.5,
    marginTop: 6,
  },

  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    width: SW - 48,
    backgroundColor: Colors.infoBg,
    borderRadius: 14,
    padding: 14,
    marginTop: 16,
  },
  infoIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.brandGreen,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    color: Colors.textPrimary,
  },

  sendBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    width: SW - 48,
    backgroundColor: Colors.primary,
    borderRadius: 16,
    paddingVertical: 16,
    marginTop: 18,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  sendBtnDisabled: {
    opacity: 0.5,
  },
  sendBtnText: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.white,
  },

  footerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: SW - 48,
    backgroundColor: Colors.footerBg,
    borderRadius: 16,
    padding: 14,
    marginTop: 18,
  },
  footerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  footerIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1.4,
    borderColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  footerTextWrap: {
    flex: 1,
  },
  footerTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.brandGreen,
  },
  footerSubtext: {
    fontSize: 12.5,
    color: Colors.textSecondary,
    marginTop: 2,
  },
});
