import React, { useEffect, useState } from 'react';
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
import { ArrowRightIcon } from '../components/Icons';
import BackButton from '../components/BackButton';
import StepProgressHeader from '../components/StepProgressHeader';
import DocumentUploadRow, { DocumentRowStatus } from '../components/DocumentUploadRow';
import { captureDocumentPhoto, pickDocumentFile } from '../services/filePicker';
import {
  DocumentSide,
  DocumentType,
  useGetPartnerProfileQuery,
  useUploadDocumentMutation,
} from '../store/deliveryApi';
import { extractApiErrorMessage } from '../store/authApi';

type Props = NativeStackScreenProps<AuthStackParamList, 'DocumentUpload'>;

type DocRowSpec = { type: DocumentType; side?: DocumentSide; label: string };

const BASE_ROWS: DocRowSpec[] = [
  { type: 'AADHAAR', side: 'FRONT', label: 'Aadhaar Card — Front' },
  { type: 'AADHAAR', side: 'BACK', label: 'Aadhaar Card — Back' },
  { type: 'PAN', label: 'PAN Card' },
];

const MOTORIZED_ROWS: DocRowSpec[] = [
  { type: 'DRIVING_LICENSE', side: 'FRONT', label: 'Driving License — Front' },
  { type: 'DRIVING_LICENSE', side: 'BACK', label: 'Driving License — Back' },
  { type: 'VEHICLE_RC', label: 'Vehicle RC' },
];

function rowKey(type: DocumentType, side?: DocumentSide): string {
  return `${type}-${side ?? 'single'}`;
}

// S06 — Registration: Document Upload (M2.3). Hands off to Bank Details
// (S07 / M2.4), the last step before Submission & Review.
export default function DocumentUploadScreen({ navigation }: Props) {
  const { data: profile, isLoading: isProfileLoading } = useGetPartnerProfileQuery();
  const [uploadDocument] = useUploadDocumentMutation();

  const [rowStatus, setRowStatus] = useState<Record<string, DocumentRowStatus>>({});
  const [rowError, setRowError] = useState<Record<string, string | undefined>>({});

  const rows: DocRowSpec[] = profile?.vehicleType === 'BIKE' ? [...BASE_ROWS, ...MOTORIZED_ROWS] : BASE_ROWS;

  // Resume state — documents already uploaded in a prior session come back
  // via the profile; don't clobber a status set locally during this session.
  useEffect(() => {
    if (!profile) return;
    setRowStatus((prev) => {
      const next = { ...prev };
      for (const doc of profile.documents) {
        const key = rowKey(doc.type, doc.side ?? undefined);
        if (!(key in next)) next[key] = 'uploaded';
      }
      return next;
    });
  }, [profile]);

  const allUploaded = rows.length > 0 && rows.every((row) => rowStatus[rowKey(row.type, row.side)] === 'uploaded');

  const doUpload = async (row: DocRowSpec, source: 'camera' | 'file') => {
    const key = rowKey(row.type, row.side);
    const file = source === 'camera' ? await captureDocumentPhoto() : await pickDocumentFile();
    if (!file) return;

    setRowStatus((prev) => ({ ...prev, [key]: 'uploading' }));
    setRowError((prev) => ({ ...prev, [key]: undefined }));
    try {
      await uploadDocument({ type: row.type, side: row.side, file }).unwrap();
      setRowStatus((prev) => ({ ...prev, [key]: 'uploaded' }));
    } catch (err) {
      setRowStatus((prev) => ({ ...prev, [key]: 'failed' }));
      setRowError((prev) => ({ ...prev, [key]: extractApiErrorMessage(err, 'Upload failed. Please retry.') }));
    }
  };

  const handleRowPress = (row: DocRowSpec) => {
    Alert.alert(row.label, 'Add this document', [
      { text: 'Take Photo', onPress: () => doUpload(row, 'camera') },
      { text: 'Choose File', onPress: () => doUpload(row, 'file') },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handleNext = () => {
    if (!allUploaded) return;
    navigation.navigate('BankDetails');
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

          <StepProgressHeader step={3} total={4} label="Upload Documents" />
          <Text style={styles.subtitle}>Clear photos, all corners visible</Text>

          {isProfileLoading ? (
            <ActivityIndicator color={Colors.brandGreen} style={styles.loader} />
          ) : (
            <View style={styles.rowsWrap}>
              {rows.map((row) => {
                const key = rowKey(row.type, row.side);
                return (
                  <DocumentUploadRow
                    key={key}
                    label={row.label}
                    status={rowStatus[key] ?? 'idle'}
                    errorMessage={rowError[key]}
                    onPress={() => handleRowPress(row)}
                  />
                );
              })}
            </View>
          )}

          <TouchableOpacity
            style={[styles.submitBtn, !allUploaded && styles.submitBtnDisabled]}
            activeOpacity={0.85}
            disabled={!allUploaded}
            onPress={handleNext}
          >
            <Text style={styles.submitBtnText}>Next</Text>
            <ArrowRightIcon size={18} color={Colors.white} />
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
    paddingTop: 12,
    paddingBottom: 24,
  },

  subtitle: {
    width: SW - 48,
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: -8,
    marginBottom: 16,
  },

  loader: {
    marginTop: 24,
    marginBottom: 24,
  },

  rowsWrap: {
    width: SW - 48,
    marginBottom: 8,
  },

  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    width: SW - 48,
    backgroundColor: Colors.primary,
    borderRadius: 16,
    paddingVertical: 16,
    marginTop: 12,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  submitBtnDisabled: {
    opacity: 0.5,
  },
  submitBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.white,
  },
});
