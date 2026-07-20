import React from 'react';
import { ActivityIndicator, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '../theme/colors';
import { SW } from '../theme/styles';
import { AssignmentResponse } from '../store/deliveryApi';
import { ClockIcon, IdCardIcon, LocationPinIcon } from './Icons';

type Props = {
  assignment: AssignmentResponse;
  secondsLeft: number;
  totalSeconds: number;
  isResponding: boolean;
  onAccept: () => void;
  onReject: () => void;
};

function formatRupees(paise: number): string {
  return `₹${Math.round(paise / 100).toLocaleString('en-IN')}`;
}

// S10 — Incoming Request (M4.1). FR-4.2/FR-4.3: pickup kitchen + distance,
// drop locality, estimated payout/distance, item count, and a countdown that
// auto-declines when it hits zero (see HomeScreen's timer effect).
export default function IncomingRequestModal({ assignment, secondsLeft, totalSeconds, isResponding, onAccept, onReject }: Props) {
  return (
    <Modal visible transparent animationType="slide" statusBarTranslucent>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.timerRow}>
            <ClockIcon size={16} color={Colors.primary} />
            <Text style={styles.timerText}>New request — {secondsLeft}s</Text>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${Math.max(0, (secondsLeft / totalSeconds) * 100)}%` }]} />
          </View>

          <Text style={styles.title}>New Delivery Request</Text>

          <View style={styles.row}>
            <View style={styles.rowIconWrap}>
              <IdCardIcon size={18} />
            </View>
            <View style={styles.rowText}>
              <Text style={styles.rowLabel}>Pickup</Text>
              <Text style={styles.rowValue}>
                {assignment.kitchenName} · {assignment.kitchenDistanceKm.toFixed(1)} km
              </Text>
            </View>
          </View>
          <View style={styles.row}>
            <View style={styles.rowIconWrap}>
              <LocationPinIcon size={18} />
            </View>
            <View style={styles.rowText}>
              <Text style={styles.rowLabel}>Drop</Text>
              <Text style={styles.rowValue}>{assignment.dropLocality}</Text>
            </View>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statBlock}>
              <Text style={styles.statValue}>{formatRupees(assignment.estimatedPayoutPaise)}</Text>
              <Text style={styles.statLabel}>Est. Payout</Text>
            </View>
            <View style={styles.statBlock}>
              <Text style={styles.statValue}>{assignment.estimatedDistanceKm.toFixed(1)} km</Text>
              <Text style={styles.statLabel}>Total Distance</Text>
            </View>
            <View style={styles.statBlock}>
              <Text style={styles.statValue}>{assignment.itemCount}</Text>
              <Text style={styles.statLabel}>Items</Text>
            </View>
          </View>

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.btn, styles.rejectBtn]}
              activeOpacity={0.85}
              disabled={isResponding}
              onPress={onReject}
            >
              <Text style={styles.rejectBtnText}>Reject</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.btn, styles.acceptBtn]}
              activeOpacity={0.85}
              disabled={isResponding}
              onPress={onAccept}
            >
              {isResponding ? <ActivityIndicator color={Colors.white} /> : <Text style={styles.acceptBtnText}>Accept</Text>}
            </TouchableOpacity>
          </View>
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

  timerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  timerText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primary,
  },
  progressTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
    overflow: 'hidden',
    marginBottom: 18,
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
  },

  title: {
    fontSize: 19,
    fontWeight: '800',
    color: Colors.brandGreen,
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
    marginBottom: 22,
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

  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  btn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    paddingVertical: 15,
  },
  rejectBtn: {
    backgroundColor: Colors.surface,
    borderWidth: 1.6,
    borderColor: Colors.error,
  },
  rejectBtnText: {
    fontSize: 15.5,
    fontWeight: '700',
    color: Colors.error,
  },
  acceptBtn: {
    backgroundColor: Colors.online,
  },
  acceptBtnText: {
    fontSize: 15.5,
    fontWeight: '700',
    color: Colors.white,
  },
});
