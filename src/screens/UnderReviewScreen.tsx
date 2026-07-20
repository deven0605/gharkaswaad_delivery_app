import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ImageBackground,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Colors } from '../theme/colors';
import { commonStyles, SW } from '../theme/styles';
import { AuthStackParamList } from '../navigation/types';
import { AlertCircleIcon, CheckCircleIcon, ClipboardCheckIcon, ClockIcon, IdCardIcon } from '../components/Icons';
import { captureDocumentPhoto, pickDocumentFile } from '../services/filePicker';
import {
  DocumentResponse,
  DocumentSide,
  DocumentType,
  useGetPartnerProfileQuery,
  useUploadDocumentMutation,
} from '../store/deliveryApi';
import { extractApiErrorMessage } from '../store/authApi';
import { useAppDispatch } from '../store/hooks';
import { setLifecycleState } from '../store/authSlice';

type Props = NativeStackScreenProps<AuthStackParamList, 'UnderReview'>;

const DOC_LABELS: Record<string, string> = {
  'AADHAAR-FRONT': 'Aadhaar Card — Front',
  'AADHAAR-BACK': 'Aadhaar Card — Back',
  'PAN-null': 'PAN Card',
  'DRIVING_LICENSE-FRONT': 'Driving License — Front',
  'DRIVING_LICENSE-BACK': 'Driving License — Back',
  'VEHICLE_RC-null': 'Vehicle RC',
};

function labelFor(type: DocumentType, side: DocumentSide | null): string {
  return DOC_LABELS[`${type}-${side ?? 'null'}`] ?? type;
}

// S08 — Submission & Review (M2.5). Reached after FR-2.9 submit, and again on
// every app open while PENDING_VERIFICATION (FR-1.10). Per-document status +
// FR-2.11 re-upload of flagged documents; "Check Status" pulls the latest Ops
// decision since there's no push-notification infra yet (FR-2.10).
export default function UnderReviewScreen({ navigation }: Props) {
  const dispatch = useAppDispatch();
  const { data: profile, isFetching, refetch } = useGetPartnerProfileQuery();
  const [uploadDocument] = useUploadDocumentMutation();
  const [reuploadingKey, setReuploadingKey] = useState<string | null>(null);
  const [reuploadError, setReuploadError] = useState<Record<string, string | undefined>>({});

  const handleCheckStatus = async () => {
    const result = await refetch();
    const latest = result.data;
    if (!latest) return;
    if (latest.lifecycleState !== 'PENDING_VERIFICATION') {
      dispatch(setLifecycleState(latest.lifecycleState));
    }
    if (latest.lifecycleState === 'APPROVED') {
      navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
    }
  };

  const handleReupload = (doc: DocumentResponse) => {
    Alert.alert(labelFor(doc.type, doc.side), 'Re-upload this document', [
      { text: 'Take Photo', onPress: () => doReupload(doc, 'camera') },
      { text: 'Choose File', onPress: () => doReupload(doc, 'file') },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const doReupload = async (doc: DocumentResponse, source: 'camera' | 'file') => {
    const file = source === 'camera' ? await captureDocumentPhoto() : await pickDocumentFile();
    if (!file) return;

    setReuploadingKey(doc.id);
    setReuploadError((prev) => ({ ...prev, [doc.id]: undefined }));
    try {
      await uploadDocument({ type: doc.type, side: doc.side ?? undefined, file }).unwrap();
    } catch (err) {
      setReuploadError((prev) => ({ ...prev, [doc.id]: extractApiErrorMessage(err, 'Upload failed. Please retry.') }));
    } finally {
      setReuploadingKey(null);
    }
  };

  const documents = profile?.documents ?? [];
  const rejectedCount = documents.filter((d) => d.status === 'REJECTED').length;

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
          showsVerticalScrollIndicator={false}
        >
          <ClipboardCheckIcon size={64} />

          <Text style={styles.title}>
            {rejectedCount > 0 ? 'Action Needed' : 'Application Submitted!'}
          </Text>
          <Text style={styles.subtitle}>
            {rejectedCount > 0
              ? `${rejectedCount} document${rejectedCount > 1 ? 's need' : ' needs'} to be re-uploaded before we can continue.`
              : "We're reviewing your details — this usually takes 24-48 hrs."}
          </Text>

          <View style={styles.docsWrap}>
            {documents.map((doc) => {
              const key = doc.id;
              const isReuploading = reuploadingKey === key;
              return (
                <View key={key} style={[styles.docRow, doc.status === 'REJECTED' && styles.docRowError]}>
                  <View style={styles.docHeader}>
                    <View style={styles.iconWrap}>
                      <IdCardIcon size={18} />
                    </View>
                    <View style={styles.docTextWrap}>
                      <Text style={styles.docLabel}>{labelFor(doc.type, doc.side)}</Text>
                      {doc.status === 'REJECTED' && (
                        <Text style={styles.rejectReason}>{doc.rejectReason ?? 'Rejected — please re-upload.'}</Text>
                      )}
                      {reuploadError[key] && <Text style={styles.rejectReason}>{reuploadError[key]}</Text>}
                    </View>
                    {isReuploading ? (
                      <ActivityIndicator color={Colors.primary} />
                    ) : doc.status === 'VERIFIED' ? (
                      <CheckCircleIcon size={20} />
                    ) : doc.status === 'REJECTED' ? (
                      <AlertCircleIcon size={20} />
                    ) : (
                      <ClockIcon size={18} color={Colors.warning} />
                    )}
                  </View>
                  {doc.status === 'REJECTED' && !isReuploading && (
                    <TouchableOpacity style={styles.reuploadBtn} activeOpacity={0.8} onPress={() => handleReupload(doc)}>
                      <Text style={styles.reuploadBtnText}>Re-upload</Text>
                    </TouchableOpacity>
                  )}
                </View>
              );
            })}
          </View>

          <Text style={styles.note}>We'll notify you once your account is approved.</Text>

          <TouchableOpacity style={styles.checkBtn} activeOpacity={0.85} onPress={handleCheckStatus} disabled={isFetching}>
            {isFetching ? <ActivityIndicator color={Colors.white} /> : <Text style={styles.checkBtnText}>Check Status</Text>}
          </TouchableOpacity>
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
    paddingTop: 48,
    paddingBottom: 32,
    paddingHorizontal: 24,
  },

  title: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.brandGreen,
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },

  docsWrap: {
    width: SW - 48,
    marginBottom: 8,
  },
  docRow: {
    width: '100%',
    borderWidth: 1.4,
    borderColor: Colors.border,
    borderRadius: 14,
    backgroundColor: Colors.surface,
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginBottom: 10,
  },
  docRowError: {
    borderColor: Colors.error,
  },
  docHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.infoBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  docTextWrap: {
    flex: 1,
    marginRight: 8,
  },
  docLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  rejectReason: {
    fontSize: 11.5,
    color: Colors.error,
    marginTop: 2,
  },
  reuploadBtn: {
    alignSelf: 'flex-start',
    marginTop: 10,
    borderWidth: 1.4,
    borderColor: Colors.error,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  reuploadBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: Colors.error,
  },

  note: {
    fontSize: 12.5,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24,
  },

  checkBtn: {
    width: SW - 48,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 16,
    paddingVertical: 16,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  checkBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.white,
  },
});
