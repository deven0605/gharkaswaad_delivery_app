import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ImageBackground,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Colors } from '../theme/colors';
import { commonStyles, SW } from '../theme/styles';
import { AuthStackParamList } from '../navigation/types';
import { PartnerLifecycleState } from '../store/authSlice';
import BackButton from '../components/BackButton';
import {
  AlertCircleIcon,
  BicycleIcon,
  CameraIcon,
  IdCardIcon,
  PersonIcon,
  ScooterIcon,
  StarIcon,
  WalkIcon,
} from '../components/Icons';
import { captureSelfie, captureDocumentPhoto, pickDocumentFile } from '../services/filePicker';
import { extractApiErrorMessage } from '../store/authApi';
import {
  DocumentResponse,
  DocumentSide,
  DocumentStatus,
  DocumentType,
  VehicleType,
  useEditProfileMutation,
  useGetPartnerProfileQuery,
  useUploadDocumentMutation,
} from '../store/deliveryApi';

type Props = NativeStackScreenProps<AuthStackParamList, 'Profile'>;

type Tab = 'PROFILE' | 'DOCUMENTS';

const TABS: { key: Tab; label: string }[] = [
  { key: 'PROFILE', label: 'Profile' },
  { key: 'DOCUMENTS', label: 'Documents' },
];

const STATUS_BADGE: Record<PartnerLifecycleState, { bg: string; text: string; label: string }> = {
  APPROVED: { bg: '#DCFCE7', text: Colors.online, label: 'Approved' },
  PENDING_VERIFICATION: { bg: '#FEF3C7', text: Colors.warning, label: 'Under Review' },
  SUSPENDED: { bg: '#FEE2E2', text: Colors.error, label: 'Suspended' },
};

const VEHICLE_ICON: Record<VehicleType, typeof BicycleIcon> = {
  BICYCLE: BicycleIcon,
  BIKE: ScooterIcon,
  ON_FOOT: WalkIcon,
};

const VEHICLE_LABEL: Record<VehicleType, string> = {
  BICYCLE: 'Bicycle',
  BIKE: 'Bike / Scooter',
  ON_FOOT: 'On Foot',
};

const DOC_STATUS_BADGE: Record<DocumentStatus, { bg: string; text: string; label: string }> = {
  VERIFIED: { bg: '#DCFCE7', text: Colors.online, label: 'Verified' },
  PENDING: { bg: '#FEF3C7', text: Colors.warning, label: 'Pending' },
  REJECTED: { bg: '#FEE2E2', text: Colors.error, label: 'Rejected' },
};

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

function findDoc(documents: DocumentResponse[], type: DocumentType, side?: DocumentSide): DocumentResponse | undefined {
  return documents.find((d) => d.type === type && (d.side ?? undefined) === side);
}

// M11 — Profile & Documents. Profile tab (FR-11.1/FR-11.3): read-only
// identity/vehicle/status/rating plus an inline email/photo editor. Documents
// tab (FR-11.2): KYC status per document, re-upload only where REJECTED.
export default function ProfileScreen({ navigation }: Props) {
  const [tab, setTab] = useState<Tab>('PROFILE');
  const { data: profile, isLoading } = useGetPartnerProfileQuery();
  const [editProfile, { isLoading: isSavingProfile }] = useEditProfileMutation();
  const [uploadDocument] = useUploadDocumentMutation();

  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [emailDraft, setEmailDraft] = useState('');
  const [profileError, setProfileError] = useState<string | null>(null);
  const [isCapturingPhoto, setIsCapturingPhoto] = useState(false);

  const [docStatus, setDocStatus] = useState<Record<string, 'uploading' | 'failed'>>({});
  const [docError, setDocError] = useState<Record<string, string | undefined>>({});

  const handleStartEditEmail = () => {
    setEmailDraft(profile?.email ?? '');
    setProfileError(null);
    setIsEditingEmail(true);
  };

  const handleSaveEmail = async () => {
    setProfileError(null);
    try {
      await editProfile({ email: emailDraft.trim() }).unwrap();
      setIsEditingEmail(false);
    } catch (err) {
      setProfileError(extractApiErrorMessage(err, 'Could not update email. Please try again.'));
    }
  };

  const handleChangePhoto = async () => {
    setIsCapturingPhoto(true);
    try {
      const file = await captureSelfie();
      if (!file) return;
      setProfileError(null);
      await editProfile({ profilePhoto: file }).unwrap();
    } catch (err) {
      setProfileError(extractApiErrorMessage(err, 'Could not update your photo. Please try again.'));
    } finally {
      setIsCapturingPhoto(false);
    }
  };

  const rows: DocRowSpec[] = profile?.vehicleType === 'BIKE' ? [...BASE_ROWS, ...MOTORIZED_ROWS] : BASE_ROWS;

  const handleReupload = (row: DocRowSpec) => {
    const key = `${row.type}-${row.side ?? 'single'}`;
    Alert.alert(row.label, 'Upload a new copy of this document', [
      { text: 'Take Photo', onPress: () => doReupload(row, key, 'camera') },
      { text: 'Choose File', onPress: () => doReupload(row, key, 'file') },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const doReupload = async (row: DocRowSpec, key: string, source: 'camera' | 'file') => {
    const file = source === 'camera' ? await captureDocumentPhoto() : await pickDocumentFile();
    if (!file) return;

    setDocStatus((prev) => ({ ...prev, [key]: 'uploading' }));
    setDocError((prev) => ({ ...prev, [key]: undefined }));
    try {
      await uploadDocument({ type: row.type, side: row.side, file }).unwrap();
      setDocStatus((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    } catch (err) {
      setDocStatus((prev) => ({ ...prev, [key]: 'failed' }));
      setDocError((prev) => ({ ...prev, [key]: extractApiErrorMessage(err, 'Upload failed. Please retry.') }));
    }
  };

  const statusBadge = profile ? STATUS_BADGE[profile.lifecycleState] : null;
  const VehicleIcon = profile?.vehicleType ? VEHICLE_ICON[profile.vehicleType] : null;

  return (
    <ImageBackground source={require('../../assets/images/bg-pattern.png')} style={styles.root} resizeMode="cover">
      <StatusBar style="dark" />
      <SafeAreaView style={commonStyles.safe}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <BackButton onPress={() => navigation.goBack()} />
          <Text style={styles.title}>My Profile</Text>

          <View style={styles.tabRow}>
            {TABS.map((t) => (
              <TouchableOpacity
                key={t.key}
                style={[styles.tab, tab === t.key && styles.tabActive]}
                activeOpacity={0.85}
                onPress={() => setTab(t.key)}
              >
                <Text style={[styles.tabText, tab === t.key && styles.tabTextActive]}>{t.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {isLoading || !profile ? (
            <ActivityIndicator color={Colors.primary} style={styles.loading} />
          ) : tab === 'PROFILE' ? (
            <>
              {/* FR-11.1 — photo, name, phone, rating, status badge. */}
              <View style={styles.headerCard}>
                <TouchableOpacity style={styles.photoBox} activeOpacity={0.85} onPress={handleChangePhoto} disabled={isCapturingPhoto || isSavingProfile}>
                  {isCapturingPhoto || isSavingProfile ? (
                    <ActivityIndicator color={Colors.brandGreen} />
                  ) : profile.profilePhotoUrl ? (
                    <Image source={{ uri: profile.profilePhotoUrl }} style={styles.photoImage} />
                  ) : (
                    <PersonIcon size={32} color={Colors.brandGreen} />
                  )}
                  <View style={styles.photoEditBadge}>
                    <CameraIcon size={13} color={Colors.white} />
                  </View>
                </TouchableOpacity>

                <Text style={styles.name}>{profile.name ?? 'Delivery Partner'}</Text>
                <Text style={styles.phone}>{profile.phone}</Text>

                <View style={styles.ratingRow}>
                  <StarIcon size={15} color={Colors.warning} />
                  <Text style={styles.ratingText}>{profile.rating != null ? profile.rating.toFixed(1) : '—'}</Text>
                </View>

                {statusBadge && (
                  <View style={[styles.badge, { backgroundColor: statusBadge.bg }]}>
                    <Text style={[styles.badgeText, { color: statusBadge.text }]}>{statusBadge.label}</Text>
                  </View>
                )}
              </View>

              {/* FR-11.3 — email is directly editable. */}
              <Text style={styles.sectionTitle}>Contact</Text>
              <View style={styles.card}>
                <Text style={styles.fieldLabel}>Email</Text>
                {isEditingEmail ? (
                  <>
                    <TextInput
                      style={styles.input}
                      placeholder="you@example.com"
                      placeholderTextColor={Colors.textSecondary}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      value={emailDraft}
                      onChangeText={setEmailDraft}
                    />
                    {profileError && <Text style={styles.errorText}>{profileError}</Text>}
                    <View style={styles.editActionsRow}>
                      <TouchableOpacity style={styles.secondaryBtn} activeOpacity={0.85} disabled={isSavingProfile} onPress={() => setIsEditingEmail(false)}>
                        <Text style={styles.secondaryBtnText}>Cancel</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.saveBtn} activeOpacity={0.85} disabled={isSavingProfile} onPress={handleSaveEmail}>
                        {isSavingProfile ? <ActivityIndicator color={Colors.white} /> : <Text style={styles.saveBtnText}>Save</Text>}
                      </TouchableOpacity>
                    </View>
                  </>
                ) : (
                  <View style={styles.fieldRow}>
                    <Text style={styles.fieldValue}>{profile.email ?? 'Not set'}</Text>
                    <TouchableOpacity onPress={handleStartEditEmail}>
                      <Text style={styles.editLink}>Edit</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              {/* FR-11.1 — vehicle details. */}
              <Text style={styles.sectionTitle}>Vehicle</Text>
              <View style={styles.card}>
                {profile.vehicleType ? (
                  <>
                    <View style={styles.vehicleRow}>
                      {VehicleIcon && <VehicleIcon size={26} color={Colors.brandGreen} />}
                      <Text style={styles.vehicleLabel}>{VEHICLE_LABEL[profile.vehicleType]}</Text>
                    </View>
                    {profile.vehicleNumber && (
                      <View style={styles.fieldRow}>
                        <Text style={styles.fieldLabel}>Number</Text>
                        <Text style={styles.fieldValue}>{profile.vehicleNumber}</Text>
                      </View>
                    )}
                    {profile.vehicleModel && (
                      <View style={styles.fieldRow}>
                        <Text style={styles.fieldLabel}>Model</Text>
                        <Text style={styles.fieldValue}>{profile.vehicleModel}</Text>
                      </View>
                    )}
                  </>
                ) : (
                  <Text style={styles.emptyText}>No vehicle details on file.</Text>
                )}
              </View>

              {/* FR-11.4 — new destination takes effect from the next payout cycle. */}
              <Text style={styles.sectionTitle}>Payouts</Text>
              <View style={styles.card}>
                <Text style={styles.fieldValue}>
                  {profile.upiId ? `UPI: ${profile.upiId}` : profile.bankAccountNumber ? `Bank: •••• ${profile.bankAccountNumber.slice(-4)}` : 'Not set'}
                </Text>
                <Text style={styles.payoutNote}>Changes take effect from your next payout cycle.</Text>
                <TouchableOpacity style={styles.editBankBtn} activeOpacity={0.85} onPress={() => navigation.navigate('EditBankDetails')}>
                  <Text style={styles.editBankBtnText}>Edit Bank / UPI Details</Text>
                </TouchableOpacity>
              </View>

              {/* M13 — Help & Support. */}
              <TouchableOpacity style={styles.helpBtn} activeOpacity={0.85} onPress={() => navigation.navigate('HelpSupport')}>
                <Text style={styles.helpBtnText}>Help & Support</Text>
              </TouchableOpacity>
            </>
          ) : (
            // FR-11.2 — Documents tab.
            <View style={styles.docsWrap}>
              {rows.map((row) => {
                const key = `${row.type}-${row.side ?? 'single'}`;
                const doc = findDoc(profile.documents, row.type, row.side);
                const uploading = docStatus[key] === 'uploading';
                const failed = docStatus[key] === 'failed';
                const badge = doc ? DOC_STATUS_BADGE[doc.status] : null;

                return (
                  <View key={key} style={styles.docRow}>
                    <View style={styles.docIconWrap}>
                      <IdCardIcon size={20} />
                    </View>
                    <View style={styles.docTextWrap}>
                      <Text style={styles.docLabel}>{row.label}</Text>
                      {doc?.status === 'REJECTED' && doc.rejectReason && (
                        <Text style={styles.docRejectReason}>{doc.rejectReason}</Text>
                      )}
                      {failed && docError[key] && <Text style={styles.docRejectReason}>{docError[key]}</Text>}
                    </View>

                    {uploading ? (
                      <ActivityIndicator color={Colors.primary} />
                    ) : badge ? (
                      <View style={styles.docBadgeCol}>
                        <View style={[styles.badge, { backgroundColor: badge.bg }]}>
                          <Text style={[styles.badgeText, { color: badge.text }]}>{badge.label}</Text>
                        </View>
                        {doc?.status === 'REJECTED' && (
                          <TouchableOpacity onPress={() => handleReupload(row)}>
                            <Text style={styles.editLink}>Re-upload</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    ) : (
                      <TouchableOpacity onPress={() => handleReupload(row)}>
                        {failed ? <AlertCircleIcon size={22} /> : <Text style={styles.editLink}>Upload</Text>}
                      </TouchableOpacity>
                    )}
                  </View>
                );
              })}
            </View>
          )}
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
    paddingTop: 16,
    paddingBottom: 32,
  },
  loading: {
    marginTop: 40,
  },

  title: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.brandGreen,
    alignSelf: 'flex-start',
    marginLeft: 24,
    marginBottom: 16,
  },

  tabRow: {
    flexDirection: 'row',
    width: SW - 48,
    borderWidth: 1.4,
    borderColor: Colors.border,
    borderRadius: 14,
    backgroundColor: Colors.surface,
    padding: 4,
    marginBottom: 18,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 10,
  },
  tabActive: {
    backgroundColor: Colors.brandGreen,
  },
  tabText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  tabTextActive: {
    color: Colors.white,
  },

  headerCard: {
    width: SW - 48,
    alignItems: 'center',
    borderWidth: 1.4,
    borderColor: Colors.border,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    paddingVertical: 24,
    marginBottom: 18,
  },
  photoBox: {
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 1.6,
    borderColor: Colors.brandGreenMuted,
    backgroundColor: Colors.infoBg,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginBottom: 10,
  },
  photoImage: {
    width: '100%',
    height: '100%',
  },
  photoEditBadge: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.brandGreen,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.surface,
  },
  name: {
    fontSize: 17,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  phone: {
    fontSize: 12.5,
    color: Colors.textSecondary,
    marginTop: 2,
    marginBottom: 10,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 10,
  },
  ratingText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: Colors.textPrimary,
  },

  badge: {
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },

  sectionTitle: {
    fontSize: 14.5,
    fontWeight: '800',
    color: Colors.brandGreen,
    alignSelf: 'flex-start',
    marginLeft: 24,
    marginBottom: 10,
  },
  card: {
    width: SW - 48,
    borderWidth: 1.4,
    borderColor: Colors.border,
    borderRadius: 16,
    backgroundColor: Colors.surface,
    padding: 16,
    marginBottom: 18,
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  fieldLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  fieldValue: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  emptyText: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  editLink: {
    fontSize: 12.5,
    fontWeight: '700',
    color: Colors.primary,
  },

  input: {
    width: '100%',
    borderWidth: 1.4,
    borderColor: Colors.border,
    borderRadius: 14,
    backgroundColor: Colors.background,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: Colors.textPrimary,
    marginTop: 4,
    marginBottom: 10,
  },
  errorText: {
    color: Colors.error,
    fontSize: 12,
    marginBottom: 8,
  },
  editActionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  secondaryBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.4,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
    borderRadius: 12,
    paddingVertical: 12,
  },
  secondaryBtnText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  saveBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.brandGreen,
    borderRadius: 12,
    paddingVertical: 12,
  },
  saveBtnText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: Colors.white,
  },

  vehicleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  vehicleLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
  },

  payoutNote: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 4,
    marginBottom: 12,
    lineHeight: 15,
  },
  editBankBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.4,
    borderColor: Colors.brandGreen,
    borderRadius: 12,
    paddingVertical: 12,
  },
  editBankBtnText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: Colors.brandGreen,
  },

  helpBtn: {
    width: SW - 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.4,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    borderRadius: 14,
    paddingVertical: 14,
    marginBottom: 18,
  },
  helpBtnText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: Colors.textPrimary,
  },

  docsWrap: {
    width: SW - 48,
  },
  docRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.4,
    borderColor: Colors.border,
    borderRadius: 14,
    backgroundColor: Colors.surface,
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginBottom: 10,
  },
  docIconWrap: {
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
    fontSize: 13.5,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  docRejectReason: {
    fontSize: 11,
    color: Colors.error,
    marginTop: 2,
  },
  docBadgeCol: {
    alignItems: 'flex-end',
    gap: 4,
  },
});
