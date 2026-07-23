import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
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
import BackButton from '../components/BackButton';
import { useGetPartnerProfileQuery, useSaveBankDetailsMutation } from '../store/deliveryApi';
import { extractApiErrorMessage } from '../store/authApi';

type Props = NativeStackScreenProps<AuthStackParamList, 'EditBankDetails'>;

type PayoutMethod = 'BANK' | 'UPI';

const IFSC_REGEX = /^[A-Z]{4}0[A-Z0-9]{6}$/;
const UPI_REGEX = /^[\w.\-]{2,256}@[a-zA-Z]{2,64}$/;

// M11 — Profile & Documents (FR-11.4). Unlike the onboarding BankDetailsScreen
// (which ends in submitApplication), this only saves — reachable any time
// post-registration from the Profile screen. The new destination takes
// effect from the partner's next payout cycle (payouts are a weekly Ops
// batch, same as PayoutHistoryScreen notes).
export default function EditBankDetailsScreen({ navigation }: Props) {
  const { data: profile } = useGetPartnerProfileQuery();
  const [saveBankDetails, { isLoading }] = useSaveBankDetailsMutation();

  const [method, setMethod] = useState<PayoutMethod>('BANK');
  const [accountHolderName, setAccountHolderName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [upiId, setUpiId] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  // Prefill with whatever's currently on file.
  useEffect(() => {
    if (!profile) return;
    if (profile.upiId) {
      setMethod('UPI');
      setUpiId(profile.upiId);
    } else if (profile.bankAccountNumber) {
      setMethod('BANK');
      setAccountHolderName(profile.bankAccountHolderName ?? '');
      setAccountNumber(profile.bankAccountNumber ?? '');
      setIfscCode(profile.bankIfscCode ?? '');
    }
  }, [profile]);

  const isValid =
    method === 'BANK'
      ? accountHolderName.trim().length > 0 && accountNumber.trim().length > 0 && IFSC_REGEX.test(ifscCode.trim().toUpperCase())
      : UPI_REGEX.test(upiId.trim());

  const handleSave = async () => {
    if (!isValid || isLoading) return;
    setError(null);
    setSaved(false);
    try {
      await saveBankDetails(
        method === 'BANK'
          ? {
              accountHolderName: accountHolderName.trim(),
              accountNumber: accountNumber.trim(),
              ifscCode: ifscCode.trim().toUpperCase(),
            }
          : { upiId: upiId.trim() }
      ).unwrap();
      setSaved(true);
    } catch (err) {
      setError(extractApiErrorMessage(err, 'Could not save your payout details. Please try again.'));
    }
  };

  return (
    <ImageBackground source={require('../../assets/images/bg-pattern.png')} style={styles.root} resizeMode="cover">
      <StatusBar style="dark" />
      <SafeAreaView style={commonStyles.safe}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <BackButton onPress={() => navigation.goBack()} />
          <Text style={styles.title}>Bank / UPI Details</Text>
          <Text style={styles.subtitle}>The new payout destination takes effect from your next payout cycle.</Text>

          <View style={styles.tabRow}>
            {(['BANK', 'UPI'] as const).map((tab) => {
              const selected = method === tab;
              return (
                <TouchableOpacity
                  key={tab}
                  style={[styles.tab, selected && styles.tabActive]}
                  activeOpacity={0.85}
                  onPress={() => setMethod(tab)}
                >
                  <Text style={[styles.tabText, selected && styles.tabTextActive]}>
                    {tab === 'BANK' ? 'Bank Account' : 'UPI'}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {method === 'BANK' ? (
            <>
              <Text style={styles.label}>Account Holder Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="Ravi Kumar"
                placeholderTextColor={Colors.textSecondary}
                value={accountHolderName}
                onChangeText={setAccountHolderName}
              />

              <Text style={styles.label}>Account Number *</Text>
              <TextInput
                style={styles.input}
                placeholder="123456789012"
                placeholderTextColor={Colors.textSecondary}
                keyboardType="number-pad"
                value={accountNumber}
                onChangeText={setAccountNumber}
              />

              <Text style={styles.label}>IFSC Code *</Text>
              <TextInput
                style={styles.input}
                placeholder="SBIN0001234"
                placeholderTextColor={Colors.textSecondary}
                autoCapitalize="characters"
                value={ifscCode}
                onChangeText={setIfscCode}
              />
            </>
          ) : (
            <>
              <Text style={styles.label}>UPI ID *</Text>
              <TextInput
                style={styles.input}
                placeholder="ravikumar@upi"
                placeholderTextColor={Colors.textSecondary}
                autoCapitalize="none"
                value={upiId}
                onChangeText={setUpiId}
              />
            </>
          )}

          {error && <Text style={styles.errorText}>{error}</Text>}
          {saved && <Text style={styles.successText}>Payout details updated.</Text>}

          <TouchableOpacity
            style={[styles.saveBtn, (!isValid || isLoading) && styles.saveBtnDisabled]}
            activeOpacity={0.85}
            disabled={!isValid || isLoading}
            onPress={handleSave}
          >
            {isLoading ? <ActivityIndicator color={Colors.white} /> : <Text style={styles.saveBtnText}>Save</Text>}
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
    paddingTop: 16,
    paddingBottom: 32,
  },

  title: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.brandGreen,
    alignSelf: 'flex-start',
    marginLeft: 24,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12.5,
    color: Colors.textSecondary,
    alignSelf: 'flex-start',
    marginLeft: 24,
    marginRight: 24,
    marginBottom: 18,
    lineHeight: 18,
  },

  tabRow: {
    flexDirection: 'row',
    width: SW - 48,
    marginBottom: 20,
    gap: 10,
  },
  tab: {
    flex: 1,
    borderWidth: 1.4,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: Colors.surface,
  },
  tabActive: {
    borderColor: Colors.brandGreen,
    backgroundColor: Colors.brandGreen,
  },
  tabText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  tabTextActive: {
    color: Colors.white,
  },

  label: {
    width: SW - 48,
    fontSize: 13.5,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 6,
  },
  input: {
    width: SW - 48,
    borderWidth: 1.4,
    borderColor: Colors.border,
    borderRadius: 14,
    backgroundColor: Colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: Colors.textPrimary,
    marginBottom: 16,
  },

  errorText: {
    width: SW - 48,
    color: Colors.error,
    fontSize: 12.5,
    marginBottom: 12,
  },
  successText: {
    width: SW - 48,
    color: Colors.online,
    fontSize: 12.5,
    fontWeight: '600',
    marginBottom: 12,
  },

  saveBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    width: SW - 48,
    backgroundColor: Colors.primary,
    borderRadius: 16,
    paddingVertical: 16,
    marginTop: 8,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  saveBtnDisabled: {
    opacity: 0.5,
  },
  saveBtnText: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.white,
  },
});
