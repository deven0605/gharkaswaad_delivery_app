import React, { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ImageBackground,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Colors } from '../theme/colors';
import { commonStyles, SW } from '../theme/styles';
import { AuthStackParamList } from '../navigation/types';
import { ArrowRightIcon, CameraIcon } from '../components/Icons';
import BackButton from '../components/BackButton';
import StepProgressHeader from '../components/StepProgressHeader';
import { captureSelfie, formatDisplayDate, toIsoDate } from '../services/filePicker';
import { PickedFile, useSavePersonalDetailsMutation } from '../store/deliveryApi';
import { extractApiErrorMessage } from '../store/authApi';

type Props = NativeStackScreenProps<AuthStackParamList, 'PersonalDetails'>;

const MAX_DOB = new Date(); // FR-2.1 + backend @Past — can't be born in the future

// S04 — Registration: Personal Details (M2.1). Reached once, for a brand-new
// number, after OTP verification.
export default function PersonalDetailsScreen({ navigation }: Props) {
  const [selfie, setSelfie] = useState<PickedFile | null>(null);
  const [fullName, setFullName] = useState('');
  const [dob, setDob] = useState<Date | null>(null);
  const [showDobPicker, setShowDobPicker] = useState(false);
  const [gender, setGender] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);

  const [saveDetails, { isLoading }] = useSavePersonalDetailsMutation();

  const isValid = selfie !== null && fullName.trim().length > 0 && dob !== null;

  const handleCaptureSelfie = async () => {
    setIsCapturing(true);
    try {
      const file = await captureSelfie();
      if (file) setSelfie(file);
    } finally {
      setIsCapturing(false);
    }
  };

  const handleNext = async () => {
    if (!isValid || !selfie || !dob || isLoading) return;
    setError(null);
    try {
      console.log("fullName");
      console.log(fullName);
      await saveDetails({
        fullName: fullName.trim(),
        dob: toIsoDate(dob),
        gender: gender ?? undefined,
        email: email.trim() ? email.trim() : undefined,
        profilePhoto: selfie,
      }).unwrap();
      navigation.navigate('VehicleDetails');
    } catch (err) {
      console.log("Error saving personal details: ");
      console.log(err);
      setError(extractApiErrorMessage(err, 'Could not save your details. Please try again.'));
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

          <StepProgressHeader step={1} total={4} label="Tell us about you" />

          <TouchableOpacity style={styles.selfieBox} activeOpacity={0.85} onPress={handleCaptureSelfie}>
            {isCapturing ? (
              <ActivityIndicator color={Colors.brandGreen} />
            ) : selfie ? (
              <Image source={{ uri: selfie.uri }} style={styles.selfieImage} />
            ) : (
              <>
                <CameraIcon size={30} />
                <Text style={styles.selfieText}>Take Selfie</Text>
              </>
            )}
          </TouchableOpacity>
          <Text style={styles.selfieCaption}>Used for pickup/drop identity verification</Text>

          <Text style={styles.label}>Full Name *</Text>
          <TextInput
            style={styles.input}
            placeholder="Ravi Kumar"
            placeholderTextColor={Colors.textSecondary}
            value={fullName}
            onChangeText={setFullName}
          />

          <Text style={styles.label}>Date of Birth *</Text>
          <TouchableOpacity style={styles.input} activeOpacity={0.8} onPress={() => setShowDobPicker(true)}>
            <Text style={dob ? styles.dateValue : styles.datePlaceholder}>
              {dob ? formatDisplayDate(dob) : 'DD / MM / YYYY'}
            </Text>
          </TouchableOpacity>
          {showDobPicker && (
            <DateTimePicker
              value={dob ?? new Date(2000, 0, 1)}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              maximumDate={MAX_DOB}
              onChange={(_event, selectedDate) => {
                setShowDobPicker(Platform.OS === 'ios');
                if (selectedDate) setDob(selectedDate);
              }}
            />
          )}

          <Text style={styles.label}>Gender (optional)</Text>
          <View style={styles.genderRow}>
            {(['Male', 'Female', 'Other'] as const).map((option) => (
              <TouchableOpacity
                key={option}
                style={[styles.genderChip, gender === option && styles.genderChipActive]}
                activeOpacity={0.8}
                onPress={() => setGender(gender === option ? null : option)}
              >
                <Text style={[styles.genderChipText, gender === option && styles.genderChipTextActive]}>
                  {option}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Email (optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="you@example.com"
            placeholderTextColor={Colors.textSecondary}
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />

          {error && <Text style={styles.errorText}>{error}</Text>}

          <TouchableOpacity
            style={[styles.nextBtn, (!isValid || isLoading) && styles.nextBtnDisabled]}
            activeOpacity={0.85}
            disabled={!isValid || isLoading}
            onPress={handleNext}
          >
            {isLoading ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <>
                <Text style={styles.nextBtnText}>Next</Text>
                <ArrowRightIcon size={18} color={Colors.white} />
              </>
            )}
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

  selfieBox: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 1.6,
    borderColor: Colors.brandGreenMuted,
    borderStyle: 'dashed',
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  selfieImage: {
    width: '100%',
    height: '100%',
  },
  selfieText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: Colors.brandGreen,
    marginTop: 6,
  },
  selfieCaption: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 20,
    width: SW - 80,
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
    justifyContent: 'center',
  },
  dateValue: {
    fontSize: 15,
    color: Colors.textPrimary,
  },
  datePlaceholder: {
    fontSize: 15,
    color: Colors.textSecondary,
  },

  genderRow: {
    flexDirection: 'row',
    width: SW - 48,
    marginBottom: 16,
    gap: 10,
  },
  genderChip: {
    flex: 1,
    borderWidth: 1.4,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: Colors.surface,
  },
  genderChipActive: {
    borderColor: Colors.brandGreen,
    backgroundColor: Colors.infoBg,
  },
  genderChipText: {
    fontSize: 13.5,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  genderChipTextActive: {
    color: Colors.brandGreen,
  },

  errorText: {
    width: SW - 48,
    color: Colors.error,
    fontSize: 12.5,
    marginBottom: 12,
  },

  nextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
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
  nextBtnDisabled: {
    opacity: 0.5,
  },
  nextBtnText: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.white,
  },
});
