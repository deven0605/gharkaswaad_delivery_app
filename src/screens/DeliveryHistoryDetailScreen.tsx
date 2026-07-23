import React from 'react';
import { ActivityIndicator, ImageBackground, ScrollView, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Colors } from '../theme/colors';
import { commonStyles, SW } from '../theme/styles';
import { AuthStackParamList } from '../navigation/types';
import BackButton from '../components/BackButton';
import { LocationPinIcon } from '../components/Icons';
import { DeliveryHistoryStatus, useGetDeliveryHistoryDetailQuery } from '../store/deliveryApi';

type Props = NativeStackScreenProps<AuthStackParamList, 'DeliveryHistoryDetail'>;

function formatRupees(paise: number): string {
  return `₹${Math.round(paise / 100).toLocaleString('en-IN')}`;
}

function formatDateTime(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' });
}

const STATUS_STYLE: Record<DeliveryHistoryStatus, { bg: string; text: string; label: string }> = {
  DELIVERED: { bg: '#DCFCE7', text: Colors.online, label: 'Completed' },
  CANCELLED_BY_PARTNER: { bg: '#FEE2E2', text: Colors.error, label: 'Cancelled by you' },
  CANCELLED_BY_CUSTOMER: { bg: '#FEE2E2', text: Colors.error, label: 'Cancelled by customer' },
  CANCELLED_BY_KITCHEN: { bg: '#FEE2E2', text: Colors.error, label: 'Cancelled by kitchen' },
};

// M9 — Delivery History Detail (FR-9.2). Route summary, full timestamp
// trail, and payout breakdown for a single past delivery.
export default function DeliveryHistoryDetailScreen({ navigation, route }: Props) {
  const { assignmentId } = route.params;
  const { data: delivery, isLoading } = useGetDeliveryHistoryDetailQuery(assignmentId);

  if (isLoading || !delivery) {
    return (
      <ImageBackground source={require('../../assets/images/bg-pattern.png')} style={styles.root} resizeMode="cover">
        <StatusBar style="dark" />
        <SafeAreaView style={commonStyles.safe}>
          <BackButton onPress={() => navigation.goBack()} />
          <ActivityIndicator color={Colors.primary} style={styles.loading} />
        </SafeAreaView>
      </ImageBackground>
    );
  }

  const badge = STATUS_STYLE[delivery.status];
  const isCancelled = delivery.status !== 'DELIVERED';

  return (
    <ImageBackground source={require('../../assets/images/bg-pattern.png')} style={styles.root} resizeMode="cover">
      <StatusBar style="dark" />
      <SafeAreaView style={commonStyles.safe}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <BackButton onPress={() => navigation.goBack()} />
          <Text style={styles.title}>Delivery Detail</Text>

          <View style={styles.headerCard}>
            <View style={styles.headerRow}>
              <Text style={styles.orderId}>Order #{delivery.orderId}</Text>
              <View style={[styles.badge, { backgroundColor: badge.bg }]}>
                <Text style={[styles.badgeText, { color: badge.text }]}>{badge.label}</Text>
              </View>
            </View>

            {/* Route summary */}
            <View style={styles.routeRow}>
              <LocationPinIcon size={16} color={Colors.brandGreen} />
              <View style={styles.routeTextWrap}>
                <Text style={styles.routeLabel}>Pickup</Text>
                <Text style={styles.routeValue}>{delivery.kitchenName}</Text>
              </View>
            </View>
            <View style={styles.routeConnector} />
            <View style={styles.routeRow}>
              <LocationPinIcon size={16} color={Colors.primary} />
              <View style={styles.routeTextWrap}>
                <Text style={styles.routeLabel}>Drop</Text>
                <Text style={styles.routeValue}>{delivery.dropLocality}</Text>
              </View>
            </View>
            <Text style={styles.distanceText}>{delivery.estimatedDistanceKm.toFixed(1)} km · {delivery.itemCount} item{delivery.itemCount === 1 ? '' : 's'}</Text>
          </View>

          {isCancelled && delivery.cancellationReason && (
            <View style={styles.reasonCard}>
              <Text style={styles.reasonLabel}>Cancellation reason</Text>
              <Text style={styles.reasonText}>{delivery.cancellationReason}</Text>
            </View>
          )}

          {/* Timestamps */}
          <Text style={styles.sectionTitle}>Timeline</Text>
          <View style={styles.timelineCard}>
            <TimelineRow label="Offered" value={formatDateTime(delivery.offeredAt)} />
            <TimelineRow label="Accepted" value={formatDateTime(delivery.acceptedAt)} />
            {!isCancelled && (
              <>
                <TimelineRow label="Arrived at kitchen" value={formatDateTime(delivery.arrivedAtKitchenAt)} />
                <TimelineRow label="Picked up" value={formatDateTime(delivery.pickedUpAt)} />
                <TimelineRow label="Out for delivery" value={formatDateTime(delivery.outForDeliveryAt)} />
                <TimelineRow label="Arrived at drop" value={formatDateTime(delivery.arrivedAtDropAt)} />
                <TimelineRow label="Delivered" value={formatDateTime(delivery.deliveredAt)} last />
              </>
            )}
            {isCancelled && <TimelineRow label="Cancelled" value={formatDateTime(delivery.cancelledAt)} last />}
          </View>

          {/* Payout breakdown */}
          {!isCancelled && (
            <>
              <Text style={styles.sectionTitle}>Payout Breakdown</Text>
              <View style={styles.payoutCard}>
                <PayoutRow label="Base fare" value={delivery.baseFarePaise} />
                <PayoutRow label="Distance fare" value={delivery.distanceFarePaise} />
                {delivery.incentivePaise > 0 && <PayoutRow label="Incentive" value={delivery.incentivePaise} />}
                <View style={styles.payoutDivider} />
                <PayoutRow label="Total payout" value={delivery.totalPayoutPaise} emphasis />
                {delivery.paymentMethod === 'COD' && delivery.codAmountPaise != null && (
                  <Text style={styles.codNote}>Includes {formatRupees(delivery.codAmountPaise)} collected as Cash on Delivery.</Text>
                )}
              </View>
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </ImageBackground>
  );
}

function TimelineRow({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <View style={[styles.timelineRow, last && styles.timelineRowLast]}>
      <Text style={styles.timelineLabel}>{label}</Text>
      <Text style={styles.timelineValue}>{value}</Text>
    </View>
  );
}

function PayoutRow({ label, value, emphasis }: { label: string; value: number; emphasis?: boolean }) {
  return (
    <View style={styles.payoutRow}>
      <Text style={[styles.payoutLabel, emphasis && styles.payoutLabelEmphasis]}>{label}</Text>
      <Text style={[styles.payoutValue, emphasis && styles.payoutValueEmphasis]}>{formatRupees(value)}</Text>
    </View>
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
    marginTop: 60,
  },

  title: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.brandGreen,
    alignSelf: 'flex-start',
    marginLeft: 24,
    marginBottom: 16,
  },

  headerCard: {
    width: SW - 48,
    borderWidth: 1.4,
    borderColor: Colors.border,
    borderRadius: 18,
    backgroundColor: Colors.surface,
    padding: 18,
    marginBottom: 14,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  orderId: {
    fontSize: 14.5,
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

  routeRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  routeConnector: {
    width: 1,
    height: 14,
    backgroundColor: Colors.border,
    marginLeft: 7,
    marginVertical: 2,
  },
  routeTextWrap: {
    flex: 1,
  },
  routeLabel: {
    fontSize: 10.5,
    color: Colors.textSecondary,
    marginBottom: 1,
  },
  routeValue: {
    fontSize: 13.5,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  distanceText: {
    fontSize: 11.5,
    color: Colors.textSecondary,
    marginTop: 12,
  },

  reasonCard: {
    width: SW - 48,
    borderWidth: 1.4,
    borderColor: Colors.border,
    borderRadius: 16,
    backgroundColor: Colors.surface,
    padding: 14,
    marginBottom: 14,
  },
  reasonLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  reasonText: {
    fontSize: 13,
    color: Colors.textPrimary,
    lineHeight: 18,
  },

  sectionTitle: {
    fontSize: 14.5,
    fontWeight: '800',
    color: Colors.brandGreen,
    alignSelf: 'flex-start',
    marginLeft: 24,
    marginBottom: 10,
    marginTop: 4,
  },

  timelineCard: {
    width: SW - 48,
    borderWidth: 1.4,
    borderColor: Colors.border,
    borderRadius: 16,
    backgroundColor: Colors.surface,
    paddingHorizontal: 16,
    marginBottom: 14,
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  timelineRowLast: {
    borderBottomWidth: 0,
  },
  timelineLabel: {
    fontSize: 12.5,
    color: Colors.textSecondary,
  },
  timelineValue: {
    fontSize: 12.5,
    fontWeight: '600',
    color: Colors.textPrimary,
  },

  payoutCard: {
    width: SW - 48,
    borderWidth: 1.4,
    borderColor: Colors.border,
    borderRadius: 16,
    backgroundColor: Colors.surface,
    padding: 16,
  },
  payoutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  payoutLabel: {
    fontSize: 12.5,
    color: Colors.textSecondary,
  },
  payoutLabelEmphasis: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  payoutValue: {
    fontSize: 12.5,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  payoutValueEmphasis: {
    fontSize: 15.5,
    fontWeight: '800',
    color: Colors.brandGreen,
  },
  payoutDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 6,
  },
  codNote: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 8,
    lineHeight: 15,
  },
});
