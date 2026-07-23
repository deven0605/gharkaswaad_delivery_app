import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, ImageBackground, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Colors } from '../theme/colors';
import { commonStyles, SW } from '../theme/styles';
import { AuthStackParamList } from '../navigation/types';
import { CameraIcon, CheckCircleIcon, IdCardIcon, KeypadIcon, RupeeIcon } from '../components/Icons';
import OtpInput from '../components/OtpInput';
import SosButton from '../components/SosButton';
import {
  useGetCurrentAssignmentQuery,
  useMarkCashCollectedMutation,
  useUploadDropPhotoMutation,
  useVerifyDeliveryMutation,
} from '../store/deliveryApi';
import { extractApiErrorMessage } from '../store/authApi';
import { captureDocumentPhoto } from '../services/filePicker';

type Props = NativeStackScreenProps<AuthStackParamList, 'DeliveryVerification'>;

function formatRupees(paise: number): string {
  return `₹${Math.round(paise / 100).toLocaleString('en-IN')}`;
}

// S15 — Delivery Verification (M6/FR-6.4-6.6, M7/FR-7.1-7.2). Reached only
// after "Arrived at Drop Location" (DropNavigationScreen). For a COD order,
// the exact cash amount must be marked collected before OTP/Contactless
// entry unlocks (FR-7.1); collecting it credits the partner's Cash in Hand
// balance (FR-7.2). Then, normally the customer shares a 4-digit OTP
// (delivered to them via SMS/push); if they're unreachable, the partner
// switches to Contactless Drop and captures a proof-of-delivery photo
// instead (FR-6.5).
export default function DeliveryVerificationScreen({ navigation }: Props) {
  const { data: assignment } = useGetCurrentAssignmentQuery(undefined, { pollingInterval: 10000 });
  const [markCashCollected, { isLoading: isCollectingCash }] = useMarkCashCollectedMutation();
  const [uploadDropPhoto, { isLoading: isUploadingPhoto }] = useUploadDropPhotoMutation();
  const [verifyDelivery, { isLoading: isVerifying }] = useVerifyDeliveryMutation();

  const [otp, setOtp] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isContactless, setIsContactless] = useState(false);
  const [photoPreviewUri, setPhotoPreviewUri] = useState<string | null>(null);
  const [codError, setCodError] = useState<string | null>(null);

  useEffect(() => {
    if (assignment === null) {
      navigation.replace('Home');
    } else if (assignment && assignment.status === 'OUT_FOR_DELIVERY') {
      navigation.replace('DropNavigation');
    } else if (assignment && assignment.status !== 'ARRIVED_AT_DROP') {
      navigation.replace('Home');
    }
  }, [assignment, navigation]);

  const finishDelivery = (payoutPaise: number, dropLocality: string) => {
    navigation.reset({ index: 0, routes: [{ name: 'DeliveryCompleted', params: { payoutPaise, dropLocality } }] });
  };

  const submitOtp = async (candidate: string) => {
    if (!assignment || candidate.length !== 4 || isVerifying) return;
    setError(null);
    try {
      await verifyDelivery({ assignmentId: assignment.id, otp: candidate }).unwrap();
      finishDelivery(assignment.estimatedPayoutPaise, assignment.dropLocality);
    } catch (err) {
      setError(extractApiErrorMessage(err, 'Incorrect delivery OTP. Please try again.'));
      setOtp('');
    }
  };

  const handleCollectCash = async () => {
    if (!assignment) return;
    setCodError(null);
    try {
      await markCashCollected({ assignmentId: assignment.id }).unwrap();
    } catch (err) {
      setCodError(extractApiErrorMessage(err, 'Could not mark cash as collected. Please try again.'));
    }
  };

  const handleCapturePhoto = async () => {
    if (!assignment) return;
    setError(null);
    const file = await captureDocumentPhoto();
    if (!file) return;
    try {
      await uploadDropPhoto({ assignmentId: assignment.id, file }).unwrap();
      setPhotoPreviewUri(file.uri);
    } catch (err) {
      setError(extractApiErrorMessage(err, 'Could not upload the photo. Please try again.'));
    }
  };

  const handleConfirmContactless = async () => {
    if (!assignment || !photoPreviewUri || isVerifying) return;
    setError(null);
    try {
      await verifyDelivery({ assignmentId: assignment.id, contactless: true }).unwrap();
      finishDelivery(assignment.estimatedPayoutPaise, assignment.dropLocality);
    } catch (err) {
      setError(extractApiErrorMessage(err, 'Could not confirm delivery. Please try again.'));
    }
  };

  if (!assignment) {
    return (
      <View style={styles.loadingRoot}>
        <ActivityIndicator color={Colors.primary} size="large" />
      </View>
    );
  }

  // FR-7.1 — the exact COD amount must be collected before OTP/Contactless entry unlocks.
  const isCodPending = assignment.paymentMethod === 'COD' && !assignment.codCollected;

  return (
    <ImageBackground source={require('../../assets/images/bg-pattern.png')} style={styles.root} resizeMode="cover">
      <StatusBar style="dark" />
      <SafeAreaView style={commonStyles.safe}>
        <SosButton />
        <View style={styles.content}>
          <View style={styles.iconWrap}>
            <IdCardIcon size={30} color={Colors.brandGreen} />
          </View>

          {isCodPending ? (
            <>
              <Text style={styles.title}>Collect Cash</Text>
              <Text style={styles.subtitle}>This is a Cash on Delivery order. Collect the exact amount from the customer before confirming delivery.</Text>

              <View style={styles.codCard}>
                <RupeeIcon size={22} color={Colors.brandGreen} />
                <Text style={styles.codAmount}>{formatRupees(assignment.codAmountPaise ?? 0)}</Text>
                <Text style={styles.codAmountLabel}>Amount to collect</Text>
              </View>
              {codError && <Text style={styles.errorText}>{codError}</Text>}

              <TouchableOpacity
                style={[styles.verifyBtn, isCollectingCash && styles.verifyBtnDisabled]}
                activeOpacity={0.85}
                disabled={isCollectingCash}
                onPress={handleCollectCash}
              >
                {isCollectingCash ? <ActivityIndicator color={Colors.white} /> : <Text style={styles.verifyBtnText}>Cash Collected</Text>}
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={styles.title}>Confirm Delivery</Text>

              {!isContactless ? (
                <>
                  <Text style={styles.subtitle}>Ask the customer for the 4-digit delivery OTP sent to their phone.</Text>

                  <View style={styles.otpWrap}>
                    <OtpInput length={4} value={otp} onChange={setOtp} boxSize={56} autoFocus />
                  </View>
                  {error && <Text style={styles.errorText}>{error}</Text>}

                  <TouchableOpacity
                    style={[styles.verifyBtn, (otp.length !== 4 || isVerifying) && styles.verifyBtnDisabled]}
                    activeOpacity={0.85}
                    disabled={otp.length !== 4 || isVerifying}
                    onPress={() => submitOtp(otp)}
                  >
                    {isVerifying ? <ActivityIndicator color={Colors.white} /> : <Text style={styles.verifyBtnText}>Confirm Delivery</Text>}
                  </TouchableOpacity>

                  <View style={styles.dividerRow}>
                    <View style={styles.dividerLine} />
                    <Text style={styles.dividerText}>OR</Text>
                    <View style={styles.dividerLine} />
                  </View>

                  <TouchableOpacity style={styles.scanBtn} activeOpacity={0.85} onPress={() => setIsContactless(true)}>
                    <CameraIcon size={18} color={Colors.brandGreen} />
                    <Text style={styles.scanBtnText}>Contactless Drop</Text>
                  </TouchableOpacity>

                  <View style={styles.manualHintRow}>
                    <KeypadIcon size={14} color={Colors.textSecondary} />
                    <Text style={styles.manualHintText}>Customer unreachable? Use Contactless Drop instead</Text>
                  </View>
                </>
              ) : (
                <>
                  <Text style={styles.subtitle}>
                    Customer unreachable? Capture a photo of the order at the drop location as proof of delivery.
                  </Text>

                  {photoPreviewUri ? (
                    <View style={styles.photoPreviewWrap}>
                      <Image source={{ uri: photoPreviewUri }} style={styles.photoPreview} />
                      <View style={styles.photoBadge}>
                        <CheckCircleIcon size={16} />
                        <Text style={styles.photoBadgeText}>Photo captured</Text>
                      </View>
                    </View>
                  ) : (
                    <TouchableOpacity style={styles.captureBtn} activeOpacity={0.85} onPress={handleCapturePhoto} disabled={isUploadingPhoto}>
                      {isUploadingPhoto ? (
                        <ActivityIndicator color={Colors.brandGreen} />
                      ) : (
                        <>
                          <CameraIcon size={28} color={Colors.brandGreen} />
                          <Text style={styles.captureBtnText}>Capture Proof Photo</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  )}
                  {error && <Text style={styles.errorText}>{error}</Text>}

                  <TouchableOpacity
                    style={[styles.verifyBtn, (!photoPreviewUri || isVerifying) && styles.verifyBtnDisabled]}
                    activeOpacity={0.85}
                    disabled={!photoPreviewUri || isVerifying}
                    onPress={handleConfirmContactless}
                  >
                    {isVerifying ? <ActivityIndicator color={Colors.white} /> : <Text style={styles.verifyBtnText}>Confirm Contactless Drop</Text>}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.backLink}
                    activeOpacity={0.7}
                    onPress={() => {
                      setIsContactless(false);
                      setPhotoPreviewUri(null);
                      setError(null);
                    }}
                  >
                    <Text style={styles.backLinkText}>Use OTP instead</Text>
                  </TouchableOpacity>
                </>
              )}
            </>
          )}
        </View>
      </SafeAreaView>
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

  codCard: {
    width: SW - 48,
    alignItems: 'center',
    borderWidth: 1.4,
    borderColor: Colors.cod,
    borderRadius: 18,
    backgroundColor: Colors.surface,
    paddingVertical: 22,
    marginBottom: 20,
  },
  codAmount: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginTop: 8,
  },
  codAmountLabel: {
    fontSize: 11.5,
    color: Colors.textSecondary,
    marginTop: 2,
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

  captureBtn: {
    width: SW - 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.6,
    borderColor: Colors.brandGreenMuted,
    borderStyle: 'dashed',
    borderRadius: 18,
    paddingVertical: 32,
    marginBottom: 18,
  },
  captureBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.brandGreen,
    marginTop: 10,
  },

  photoPreviewWrap: {
    width: SW - 48,
    alignItems: 'center',
    marginBottom: 18,
  },
  photoPreview: {
    width: '100%',
    height: 180,
    borderRadius: 18,
    marginBottom: 10,
  },
  photoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  photoBadgeText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: Colors.online,
  },

  backLink: {
    marginTop: 16,
    paddingVertical: 6,
  },
  backLinkText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
    textDecorationLine: 'underline',
  },
});
