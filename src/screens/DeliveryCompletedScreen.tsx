import React from 'react';
import { ImageBackground, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Colors } from '../theme/colors';
import { commonStyles, SW } from '../theme/styles';
import { AuthStackParamList } from '../navigation/types';
import { CheckCircleIcon, RupeeIcon } from '../components/Icons';

type Props = NativeStackScreenProps<AuthStackParamList, 'DeliveryCompleted'>;

function formatRupees(paise: number): string {
  return `₹${Math.round(paise / 100).toLocaleString('en-IN')}`;
}

// S16 — Delivery Completed Summary (M6/FR-6.6). Reached only after a
// successful verifyDelivery; the partner is already back ONLINE server-side
// (FR-6.7) by the time this renders. "Done" resets the stack to Home rather
// than pushing, so back-navigation can't return here.
export default function DeliveryCompletedScreen({ navigation, route }: Props) {
  const { payoutPaise, dropLocality } = route.params;

  const handleDone = () => {
    navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
  };

  return (
    <ImageBackground source={require('../../assets/images/bg-pattern.png')} style={styles.root} resizeMode="cover">
      <StatusBar style="dark" />
      <SafeAreaView style={commonStyles.safe}>
        <View style={styles.content}>
          <View style={commonStyles.spacer} />

          <CheckCircleIcon size={72} color={Colors.online} />
          <Text style={styles.title}>Delivery Completed!</Text>
          <Text style={styles.subtitle}>Delivered to {dropLocality}</Text>

          <View style={styles.payoutCard}>
            <RupeeIcon size={20} color={Colors.brandGreen} />
            <Text style={styles.payoutValue}>{formatRupees(payoutPaise)}</Text>
            <Text style={styles.payoutLabel}>Earned on this trip</Text>
          </View>

          <View style={commonStyles.spacer} />

          <TouchableOpacity style={styles.doneBtn} activeOpacity={0.85} onPress={handleDone}>
            <Text style={styles.doneBtnText}>Done</Text>
          </TouchableOpacity>
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
  content: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 24,
    width: SW,
  },
  title: {
    fontSize: 23,
    fontWeight: '800',
    color: Colors.brandGreen,
    marginTop: 18,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 28,
  },

  payoutCard: {
    width: SW - 48,
    alignItems: 'center',
    borderWidth: 1.4,
    borderColor: Colors.border,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    paddingVertical: 28,
  },
  payoutValue: {
    fontSize: 30,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginTop: 10,
  },
  payoutLabel: {
    fontSize: 12.5,
    color: Colors.textSecondary,
    marginTop: 4,
  },

  doneBtn: {
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
  doneBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.white,
  },
});
