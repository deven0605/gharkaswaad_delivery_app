import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ImageBackground, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Colors } from '../theme/colors';
import { commonStyles, SW } from '../theme/styles';
import { AuthStackParamList } from '../navigation/types';
import { IdCardIcon, KeypadIcon, QrCodeIcon } from '../components/Icons';
import OtpInput from '../components/OtpInput';
import QrScannerModal from '../components/QrScannerModal';
import SosButton from '../components/SosButton';
import { useGetCurrentAssignmentQuery, useVerifyPickupCodeMutation } from '../store/deliveryApi';
import { extractApiErrorMessage } from '../store/authApi';

type Props = NativeStackScreenProps<AuthStackParamList, 'PickupVerification'>;

// S13 — Pickup Verification (M5/FR-5.5-5.6). Reached only after "Arrived at
// Kitchen" (PickupNavigationScreen); the kitchen shows the partner a 4-digit
// code (or its QR) on their Vendor app/portal, entered here to confirm
// handover. M6 (Drop Navigation) isn't built yet, so a successful verify
// returns to Home rather than continuing the flow.
export default function PickupVerificationScreen({ navigation }: Props) {
  const { data: assignment } = useGetCurrentAssignmentQuery(undefined, { pollingInterval: 10000 });
  const [verifyPickupCode, { isLoading: isVerifying }] = useVerifyPickupCodeMutation();

  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showScanner, setShowScanner] = useState(false);

  useEffect(() => {
    if (assignment === null) {
      navigation.replace('Home');
    } else if (assignment && assignment.status === 'ACCEPTED') {
      navigation.replace('PickupNavigation');
    } else if (assignment && assignment.status !== 'ARRIVED_AT_KITCHEN') {
      navigation.replace('Home');
    }
  }, [assignment, navigation]);

  const submitCode = async (candidate: string) => {
    if (!assignment || candidate.length !== 4 || isVerifying) return;
    setError(null);
    try {
      await verifyPickupCode({ assignmentId: assignment.id, code: candidate }).unwrap();
      Alert.alert('Pickup Confirmed', 'Order picked up. Head to the drop-off location.', [
        { text: 'OK', onPress: () => navigation.reset({ index: 0, routes: [{ name: 'Home' }] }) },
      ]);
    } catch (err) {
      setError(extractApiErrorMessage(err, 'Incorrect pickup code. Please try again.'));
      setCode('');
    }
  };

  const handleScanned = (scannedCode: string) => {
    setShowScanner(false);
    setCode(scannedCode);
    submitCode(scannedCode);
  };

  if (!assignment) {
    return (
      <View style={styles.loadingRoot}>
        <ActivityIndicator color={Colors.primary} size="large" />
      </View>
    );
  }

  return (
    <ImageBackground source={require('../../assets/images/bg-pattern.png')} style={styles.root} resizeMode="cover">
      <StatusBar style="dark" />
      <SafeAreaView style={commonStyles.safe}>
        <SosButton />
        <View style={styles.content}>
          <View style={styles.iconWrap}>
            <IdCardIcon size={30} color={Colors.brandGreen} />
          </View>
          <Text style={styles.title}>Verify Pickup</Text>
          <Text style={styles.subtitle}>
            Ask {assignment.kitchenName} for the 4-digit pickup code, or scan the QR code they show you.
          </Text>

          <View style={styles.otpWrap}>
            <OtpInput length={4} value={code} onChange={setCode} boxSize={56} autoFocus />
          </View>
          {error && <Text style={styles.errorText}>{error}</Text>}

          <TouchableOpacity
            style={[styles.verifyBtn, (code.length !== 4 || isVerifying) && styles.verifyBtnDisabled]}
            activeOpacity={0.85}
            disabled={code.length !== 4 || isVerifying}
            onPress={() => submitCode(code)}
          >
            {isVerifying ? <ActivityIndicator color={Colors.white} /> : <Text style={styles.verifyBtnText}>Verify Pickup</Text>}
          </TouchableOpacity>

          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity style={styles.scanBtn} activeOpacity={0.85} onPress={() => setShowScanner(true)}>
            <QrCodeIcon size={18} color={Colors.brandGreen} />
            <Text style={styles.scanBtnText}>Scan QR Instead</Text>
          </TouchableOpacity>

          <View style={styles.manualHintRow}>
            <KeypadIcon size={14} color={Colors.textSecondary} />
            <Text style={styles.manualHintText}>Enter the code shown to the kitchen on their app</Text>
          </View>
        </View>
      </SafeAreaView>

      {showScanner && <QrScannerModal onScanned={handleScanned} onClose={() => setShowScanner(false)} />}
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.cream,
  },
  loadingRoot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.cream,
  },

  content: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 48,
    paddingHorizontal: 24,
    width: SW,
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.infoBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.brandGreen,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 13.5,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 28,
    paddingHorizontal: 8,
  },

  otpWrap: {
    width: SW - 96,
    marginBottom: 12,
  },
  errorText: {
    color: Colors.error,
    fontSize: 12.5,
    textAlign: 'center',
    marginBottom: 12,
  },

  verifyBtn: {
    width: SW - 48,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 16,
    paddingVertical: 16,
    marginTop: 8,
  },
  verifyBtnDisabled: {
    backgroundColor: Colors.border,
  },
  verifyBtnText: {
    fontSize: 15.5,
    fontWeight: '700',
    color: Colors.white,
  },

  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: SW - 48,
    marginVertical: 22,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },
  dividerText: {
    marginHorizontal: 12,
    fontSize: 11.5,
    fontWeight: '700',
    color: Colors.textSecondary,
  },

  scanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: SW - 48,
    borderWidth: 1.6,
    borderColor: Colors.brandGreenMuted,
    borderRadius: 16,
    paddingVertical: 15,
  },
  scanBtnText: {
    fontSize: 14.5,
    fontWeight: '700',
    color: Colors.brandGreen,
  },

  manualHintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 18,
  },
  manualHintText: {
    fontSize: 11.5,
    color: Colors.textSecondary,
  },
});
