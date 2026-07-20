import React, { useState } from 'react';
import { ActivityIndicator, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Colors } from '../theme/colors';
import { SW } from '../theme/styles';
import { ActiveDeliveryResponse } from '../store/deliveryApi';
import { DeliveryBoxIcon, IdCardIcon, LocationPinIcon } from './Icons';

type Props = {
  activeDelivery: ActiveDeliveryResponse;
  isCancelling: boolean;
  cancelError: string | null;
  onClose: () => void;
  onConfirmCancel: (reason: string) => void;
};

function formatRupees(paise: number): string {
  return `₹${Math.round(paise / 100).toLocaleString('en-IN')}`;
}

// S11 — Assignment Cancellation (M4.2/FR-4.8). Reached from the Home
// dashboard's Active Delivery card. The FR-4.7 "customer/kitchen cancelled"
// case doesn't open this modal — it's a one-shot Alert fired from HomeScreen
// when the /cancellation push arrives, since there's nothing left to confirm.
export default function ActiveAssignmentModal({ activeDelivery, isCancelling, cancelError, onClose, onConfirmCancel }: Props) {
  const [isRaisingCancellation, setIsRaisingCancellation] = useState(false);
  const [reason, setReason] = useState('');

  return (
    <Modal visible transparent animationType="slide" statusBarTranslucent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <Text style={styles.title}>Active Delivery</Text>
          <Text style={styles.orderId}>Order #{activeDelivery.orderId}</Text>

          <View style={styles.row}>
            <View style={styles.rowIconWrap}>
              <IdCardIcon size={18} />
            </View>
            <View style={styles.rowText}>
              <Text style={styles.rowLabel}>Pickup</Text>
              <Text style={styles.rowValue}>{activeDelivery.kitchenName}</Text>
            </View>
          </View>
          <View style={styles.row}>
            <View style={styles.rowIconWrap}>
              <LocationPinIcon size={18} />
            </View>
            <View style={styles.rowText}>
              <Text style={styles.rowLabel}>Drop</Text>
              <Text style={styles.rowValue}>{activeDelivery.dropLocality}</Text>
            </View>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statBlock}>
              <Text style={styles.statValue}>{formatRupees(activeDelivery.estimatedPayoutPaise)}</Text>
              <Text style={styles.statLabel}>Est. Payout</Text>
            </View>
            <View style={styles.statBlock}>
              <Text style={styles.statValue}>{activeDelivery.estimatedDistanceKm.toFixed(1)} km</Text>
              <Text style={styles.statLabel}>Total Distance</Text>
            </View>
            <View style={styles.statBlock}>
              <Text style={styles.statValue}>{activeDelivery.itemCount}</Text>
              <Text style={styles.statLabel}>Items</Text>
            </View>
          </View>

          {isRaisingCancellation ? (
            <>
              <Text style={styles.label}>Reason for cancelling *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Vehicle breakdown"
                placeholderTextColor={Colors.textSecondary}
                value={reason}
                onChangeText={setReason}
                multiline
              />
              {cancelError && <Text style={styles.errorText}>{cancelError}</Text>}
              <Text style={styles.disclaimer}>
                This is subject to Ops review and may affect your cancellation rate.
              </Text>

              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={[styles.btn, styles.secondaryBtn]}
                  activeOpacity={0.85}
                  disabled={isCancelling}
                  onPress={() => setIsRaisingCancellation(false)}
                >
                  <Text style={styles.secondaryBtnText}>Never Mind</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.btn, styles.dangerBtn, (!reason.trim() || isCancelling) && styles.btnDisabled]}
                  activeOpacity={0.85}
                  disabled={!reason.trim() || isCancelling}
                  onPress={() => onConfirmCancel(reason.trim())}
                >
                  {isCancelling ? <ActivityIndicator color={Colors.white} /> : <Text style={styles.dangerBtnText}>Confirm Cancellation</Text>}
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <View style={styles.buttonRow}>
              <TouchableOpacity style={[styles.btn, styles.secondaryBtn]} activeOpacity={0.85} onPress={onClose}>
                <Text style={styles.secondaryBtnText}>Close</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.btn, styles.dangerOutlineBtn]}
                activeOpacity={0.85}
                onPress={() => setIsRaisingCancellation(true)}
              >
                <DeliveryBoxIcon size={16} color={Colors.error} />
                <Text style={styles.dangerOutlineBtnText}>Cancel Delivery</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(28,25,23,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    width: SW,
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 32,
  },

  title: {
    fontSize: 19,
    fontWeight: '800',
    color: Colors.brandGreen,
  },
  orderId: {
    fontSize: 12.5,
    color: Colors.textSecondary,
    marginTop: 2,
    marginBottom: 16,
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  rowIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.infoBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  rowText: {
    flex: 1,
  },
  rowLabel: {
    fontSize: 11.5,
    color: Colors.textSecondary,
  },
  rowValue: {
    fontSize: 14.5,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: 1,
  },

  statsRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderColor: Colors.border,
    paddingTop: 16,
    marginTop: 6,
    marginBottom: 20,
  },
  statBlock: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 15.5,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  statLabel: {
    fontSize: 10.5,
    color: Colors.textSecondary,
    marginTop: 2,
  },

  label: {
    fontSize: 13.5,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1.4,
    borderColor: Colors.border,
    borderRadius: 14,
    backgroundColor: Colors.background,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: Colors.textPrimary,
    minHeight: 64,
    textAlignVertical: 'top',
    marginBottom: 10,
  },
  errorText: {
    color: Colors.error,
    fontSize: 12.5,
    marginBottom: 8,
  },
  disclaimer: {
    fontSize: 11.5,
    color: Colors.textSecondary,
    marginBottom: 18,
  },

  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  btn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 16,
    paddingVertical: 15,
  },
  btnDisabled: {
    opacity: 0.5,
  },
  secondaryBtn: {
    backgroundColor: Colors.background,
    borderWidth: 1.4,
    borderColor: Colors.border,
  },
  secondaryBtnText: {
    fontSize: 14.5,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  dangerOutlineBtn: {
    borderWidth: 1.6,
    borderColor: Colors.error,
  },
  dangerOutlineBtnText: {
    fontSize: 14.5,
    fontWeight: '700',
    color: Colors.error,
  },
  dangerBtn: {
    backgroundColor: Colors.error,
  },
  dangerBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.white,
  },
});
