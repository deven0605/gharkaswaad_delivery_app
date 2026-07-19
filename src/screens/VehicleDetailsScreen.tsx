import React, { useState } from 'react';
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
import { ArrowRightIcon, BicycleIcon, ScooterIcon, WalkIcon } from '../components/Icons';
import BackButton from '../components/BackButton';
import StepProgressHeader from '../components/StepProgressHeader';
import { VehicleType, useSaveVehicleDetailsMutation } from '../store/deliveryApi';
import { extractApiErrorMessage } from '../store/authApi';

type Props = NativeStackScreenProps<AuthStackParamList, 'VehicleDetails'>;

const VEHICLE_OPTIONS: { type: VehicleType; label: string; Icon: typeof BicycleIcon }[] = [
  { type: 'BICYCLE', label: 'Bicycle', Icon: BicycleIcon },
  { type: 'BIKE', label: 'Bike / Scooter', Icon: ScooterIcon },
  { type: 'ON_FOOT', label: 'On Foot', Icon: WalkIcon },
];

// S05 — Registration: Vehicle Details (M2.2).
export default function VehicleDetailsScreen({ navigation }: Props) {
  const [vehicleType, setVehicleType] = useState<VehicleType | null>(null);
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [vehicleModel, setVehicleModel] = useState('');
  const [error, setError] = useState<string | null>(null);

  const [saveVehicle, { isLoading }] = useSaveVehicleDetailsMutation();

  // FR-2.3 — vehicle number required only when motorized.
  const isMotorized = vehicleType === 'BIKE';
  const isValid = vehicleType !== null && (!isMotorized || vehicleNumber.trim().length > 0);

  const handleNext = async () => {
    if (!isValid || !vehicleType || isLoading) return;
    setError(null);
    try {
      await saveVehicle({
        vehicleType,
        vehicleNumber: isMotorized ? vehicleNumber.trim() : undefined,
        vehicleModel: isMotorized && vehicleModel.trim() ? vehicleModel.trim() : undefined,
      }).unwrap();
      navigation.navigate('DocumentUpload');
    } catch (err) {
      setError(extractApiErrorMessage(err, 'Could not save vehicle details. Please try again.'));
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

          <StepProgressHeader step={2} total={3} label="Your Vehicle" />
          <Text style={styles.subtitle}>How do you deliver?</Text>

          <View style={styles.optionsGrid}>
            {VEHICLE_OPTIONS.map(({ type, label, Icon }) => {
              const selected = vehicleType === type;
              return (
                <TouchableOpacity
                  key={type}
                  style={[styles.optionCard, selected && styles.optionCardActive]}
                  activeOpacity={0.85}
                  onPress={() => setVehicleType(type)}
                >
                  <Icon size={30} color={selected ? Colors.white : Colors.brandGreen} />
                  <Text style={[styles.optionLabel, selected && styles.optionLabelActive]}>{label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {isMotorized && (
            <>
              <Text style={styles.label}>Vehicle Number *</Text>
              <TextInput
                style={styles.input}
                placeholder="DL 04 AB 1234"
                placeholderTextColor={Colors.textSecondary}
                autoCapitalize="characters"
                value={vehicleNumber}
                onChangeText={setVehicleNumber}
              />

              <Text style={styles.label}>Vehicle Model (optional)</Text>
              <TextInput
                style={styles.input}
                placeholder="Honda Activa"
                placeholderTextColor={Colors.textSecondary}
                value={vehicleModel}
                onChangeText={setVehicleModel}
              />
            </>
          )}

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

  subtitle: {
    width: SW - 48,
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: -8,
    marginBottom: 16,
  },

  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: SW - 48,
    gap: 12,
    marginBottom: 20,
  },
  optionCard: {
    width: (SW - 48 - 12) / 2,
    borderWidth: 1.6,
    borderColor: Colors.border,
    borderRadius: 16,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  optionCardActive: {
    borderColor: Colors.brandGreen,
    backgroundColor: Colors.brandGreen,
  },
  optionLabel: {
    fontSize: 13.5,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: 8,
  },
  optionLabelActive: {
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
