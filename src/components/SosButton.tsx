import React from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { Colors } from '../theme/colors';
import { PhoneCallIcon } from './Icons';
import { callNumber } from '../services/mapsLink';
import { useGetSupportConfigQuery } from '../store/deliveryApi';

// M13/FR-13.3 — visible on the M5/M6 in-delivery screens (PickupNavigation,
// PickupVerification, DropNavigation, DeliveryVerification); confirms then
// deep-links to the phone dialer, same as "Call Kitchen"/"Call Customer".
export default function SosButton() {
  const { data: config } = useGetSupportConfigQuery();

  const handlePress = () => {
    const phone = config?.supportPhoneNumber;
    if (!phone) return;
    Alert.alert('Contact Support', `Call ${phone} for emergency support?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Call', onPress: () => callNumber(phone) },
    ]);
  };

  return (
    <TouchableOpacity style={styles.btn} activeOpacity={0.85} onPress={handlePress}>
      <PhoneCallIcon size={14} color={Colors.white} />
      <Text style={styles.text}>SOS</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    position: 'absolute',
    top: 6,
    right: 20,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.error,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 9,
    shadowColor: Colors.error,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  text: {
    fontSize: 12.5,
    fontWeight: '800',
    color: Colors.white,
  },
});
