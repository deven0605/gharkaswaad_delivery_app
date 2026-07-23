import React, { useState } from 'react';
import { ActivityIndicator, Alert, ImageBackground, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Colors } from '../theme/colors';
import { commonStyles, SW } from '../theme/styles';
import { AuthStackParamList } from '../navigation/types';
import BackButton from '../components/BackButton';
import { DeliveryBoxIcon, LocationPinIcon, RupeeIcon } from '../components/Icons';
import {
  EarningsPeriod,
  RemittanceMethod,
  useGetCashInHandQuery,
  useGetEarningsSummaryQuery,
  useRemitCashMutation,
} from '../store/deliveryApi';
import { extractApiErrorMessage } from '../store/authApi';

type Props = NativeStackScreenProps<AuthStackParamList, 'Earnings'>;

function formatRupees(paise: number): string {
  return `₹${Math.round(paise / 100).toLocaleString('en-IN')}`;
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: 'numeric', minute: '2-digit' });
}

const TABS: { key: EarningsPeriod; label: string }[] = [
  { key: 'TODAY', label: 'Today' },
  { key: 'WEEK', label: 'This Week' },
  { key: 'MONTH', label: 'This Month' },
];

// S17 — Earnings Dashboard (M8.1/FR-8.1-8.3). Today/Week/Month tabs with
// totals + a per-delivery fare breakdown, plus the M7 Cash in Hand +
// remittance flow kept visually separate (FR-8.3: "prominently, separate
// from earned wallet balance"). Links out to Payout History (M8.2, S18).
export default function EarningsScreen({ navigation }: Props) {
  const [period, setPeriod] = useState<EarningsPeriod>('TODAY');
  const { data: earnings, isLoading: isEarningsLoading } = useGetEarningsSummaryQuery(period);
  const { data: cashInHand, isLoading: isCashLoading } = useGetCashInHandQuery();
  const [remitCash, { isLoading: isRemitting }] = useRemitCashMutation();

  const [selectedMethod, setSelectedMethod] = useState<RemittanceMethod>('UPI');
  const [isRemitOpen, setIsRemitOpen] = useState(false);
  const [remitError, setRemitError] = useState<string | null>(null);

  const handleSubmitRemittance = async () => {
    setRemitError(null);
    try {
      await remitCash({ method: selectedMethod }).unwrap();
      setIsRemitOpen(false);
      Alert.alert('Submitted', "Your remittance has been recorded and is pending Ops confirmation.");
    } catch (err) {
      setRemitError(extractApiErrorMessage(err, 'Could not submit this remittance. Please try again.'));
    }
  };

  const balancePaise = cashInHand?.cashInHandPaise ?? 0;
  const thresholdPaise = cashInHand?.remittanceThresholdPaise ?? 1;
  const canRemit = cashInHand?.canRemit ?? false;
  const progress = Math.min(1, balancePaise / thresholdPaise);
  const remainingPaise = Math.max(0, thresholdPaise - balancePaise);

  return (
    <ImageBackground source={require('../../assets/images/bg-pattern.png')} style={styles.root} resizeMode="cover">
      <StatusBar style="dark" />
      <SafeAreaView style={commonStyles.safe}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <BackButton onPress={() => navigation.goBack()} />
          <Text style={styles.title}>Earnings</Text>

          {/* FR-8.1 — Today / This Week / This Month tabs */}
          <View style={styles.tabRow}>
            {TABS.map((tab) => (
              <TouchableOpacity
                key={tab.key}
                style={[styles.tab, period === tab.key && styles.tabActive]}
                activeOpacity={0.85}
                onPress={() => setPeriod(tab.key)}
              >
                <Text style={[styles.tabText, period === tab.key && styles.tabTextActive]}>{tab.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {isEarningsLoading ? (
            <ActivityIndicator color={Colors.primary} style={styles.loading} />
          ) : (
            <>
              <View style={styles.statsRow}>
                <StatTile icon={<RupeeIcon size={16} color={Colors.brandGreen} />} label="Total Earned" value={formatRupees(earnings?.totalEarningsPaise ?? 0)} />
                <StatTile icon={<DeliveryBoxIcon size={16} color={Colors.brandGreen} />} label="Deliveries" value={String(earnings?.deliveryCount ?? 0)} />
                <StatTile icon={<RupeeIcon size={16} color={Colors.brandGreen} />} label="Avg / Delivery" value={formatRupees(earnings?.averagePayoutPaise ?? 0)} />
              </View>

              {/* FR-8.2 — per-delivery fare breakdown */}
              <View style={styles.deliveriesWrap}>
                {earnings && earnings.deliveries.length > 0 ? (
                  earnings.deliveries.map((d) => (
                    <View key={d.assignmentId} style={styles.deliveryCard}>
                      <View style={styles.deliveryHeaderRow}>
                        <View style={styles.deliveryRouteWrap}>
                          <LocationPinIcon size={14} color={Colors.textSecondary} />
                          <Text style={styles.deliveryRoute} numberOfLines={1}>
                            {d.kitchenName} → {d.dropLocality}
                          </Text>
                        </View>
                        <Text style={styles.deliveryTotal}>{formatRupees(d.totalPayoutPaise)}</Text>
                      </View>
                      <Text style={styles.deliveryMeta}>Order #{d.orderId} · {formatDateTime(d.deliveredAt)}</Text>

                      <View style={styles.breakdownRow}>
                        <BreakdownItem label="Base" value={d.baseFarePaise} />
                        <BreakdownItem label="Distance" value={d.distanceFarePaise} />
                        {d.incentivePaise > 0 && <BreakdownItem label="Incentive" value={d.incentivePaise} />}
                      </View>
                    </View>
                  ))
                ) : (
                  <View style={styles.emptyCard}>
                    <Text style={styles.emptyCardText}>No deliveries in this period yet.</Text>
                  </View>
                )}
              </View>

              <TouchableOpacity style={styles.payoutHistoryLink} activeOpacity={0.85} onPress={() => navigation.navigate('PayoutHistory')}>
                <Text style={styles.payoutHistoryLinkText}>View Payout History →</Text>
              </TouchableOpacity>

              {/* M9/FR-9.1 — full delivery history, not just this period's list above. */}
              <TouchableOpacity style={styles.payoutHistoryLink} activeOpacity={0.85} onPress={() => navigation.navigate('DeliveryHistory')}>
                <Text style={styles.payoutHistoryLinkText}>View Delivery History →</Text>
              </TouchableOpacity>
            </>
          )}

          {/* FR-8.3 — Cash in Hand, kept visually separate from earned wallet balance above. */}
          <View style={styles.sectionDivider} />
          <Text style={styles.sectionTitle}>Cash in Hand</Text>

          {isCashLoading ? (
            <ActivityIndicator color={Colors.primary} style={styles.loading} />
          ) : (
            <>
              <View style={styles.balanceCard}>
                <RupeeIcon size={22} color={Colors.cod} />
                <Text style={styles.balanceValue}>{formatRupees(balancePaise)}</Text>
                <Text style={styles.balanceLabel}>COD cash collected, not yet remitted</Text>

                <View style={styles.progressTrack}>
                  <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
                </View>
                <Text style={styles.progressLabel}>
                  {canRemit
                    ? 'You can remit this balance to ThaliCloud.'
                    : `Collect ${formatRupees(remainingPaise)} more to unlock remittance (threshold ${formatRupees(thresholdPaise)}).`}
                </Text>
              </View>

              {canRemit && !isRemitOpen && (
                <TouchableOpacity style={styles.remitBtn} activeOpacity={0.85} onPress={() => setIsRemitOpen(true)}>
                  <Text style={styles.remitBtnText}>Remit to ThaliCloud</Text>
                </TouchableOpacity>
              )}

              {canRemit && isRemitOpen && (
                <View style={styles.remitPanel}>
                  <Text style={styles.remitPanelTitle}>Choose a remittance method</Text>

                  <TouchableOpacity
                    style={[styles.methodCard, selectedMethod === 'UPI' && styles.methodCardSelected]}
                    activeOpacity={0.85}
                    onPress={() => setSelectedMethod('UPI')}
                  >
                    <Text style={styles.methodTitle}>Pay via UPI</Text>
                    <Text style={styles.methodDetail}>Transfer {formatRupees(balancePaise)} to thalicloud.remit@upi, then confirm below.</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.methodCard, selectedMethod === 'SUPPORT_POINT' && styles.methodCardSelected]}
                    activeOpacity={0.85}
                    onPress={() => setSelectedMethod('SUPPORT_POINT')}
                  >
                    <Text style={styles.methodTitle}>Hand over at Support Point</Text>
                    <Text style={styles.methodDetail}>
                      Nearest support point: ThaliCloud Partner Hub, MG Road (Mon-Sat, 10 AM-7 PM). Hand over the cash there, then confirm below.
                    </Text>
                  </TouchableOpacity>

                  {remitError && <Text style={styles.errorText}>{remitError}</Text>}

                  <Text style={styles.disclaimer}>
                    This is a Phase 1 manual flow — submitting records your remittance for Ops to confirm; it isn't verified automatically.
                  </Text>

                  <View style={styles.remitActionsRow}>
                    <TouchableOpacity
                      style={[styles.secondaryBtn]}
                      activeOpacity={0.85}
                      disabled={isRemitting}
                      onPress={() => setIsRemitOpen(false)}
                    >
                      <Text style={styles.secondaryBtnText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.confirmBtn, isRemitting && styles.confirmBtnDisabled]}
                      activeOpacity={0.85}
                      disabled={isRemitting}
                      onPress={handleSubmitRemittance}
                    >
                      {isRemitting ? <ActivityIndicator color={Colors.white} /> : <Text style={styles.confirmBtnText}>I've Completed This</Text>}
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </ImageBackground>
  );
}

function StatTile({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <View style={styles.statTile}>
      {icon}
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function BreakdownItem({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.breakdownItem}>
      <Text style={styles.breakdownValue}>{formatRupees(value)}</Text>
      <Text style={styles.breakdownLabel}>{label}</Text>
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
    marginTop: 24,
    marginBottom: 24,
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

  statsRow: {
    flexDirection: 'row',
    width: SW - 48,
    gap: 10,
    marginBottom: 18,
  },
  statTile: {
    flex: 1,
    alignItems: 'center',
    borderWidth: 1.4,
    borderColor: Colors.border,
    borderRadius: 16,
    backgroundColor: Colors.surface,
    paddingVertical: 14,
    paddingHorizontal: 4,
  },
  statValue: {
    fontSize: 14.5,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginTop: 6,
  },
  statLabel: {
    fontSize: 10,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 2,
  },

  deliveriesWrap: {
    width: SW - 48,
    marginBottom: 14,
  },
  deliveryCard: {
    borderWidth: 1.4,
    borderColor: Colors.border,
    borderRadius: 16,
    backgroundColor: Colors.surface,
    padding: 14,
    marginBottom: 10,
  },
  deliveryHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  deliveryRouteWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    marginRight: 8,
  },
  deliveryRoute: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
    flexShrink: 1,
  },
  deliveryTotal: {
    fontSize: 14.5,
    fontWeight: '800',
    color: Colors.brandGreen,
  },
  deliveryMeta: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 4,
    marginBottom: 10,
  },
  breakdownRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderColor: Colors.border,
    paddingTop: 10,
    gap: 16,
  },
  breakdownItem: {
    alignItems: 'flex-start',
  },
  breakdownValue: {
    fontSize: 12.5,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  breakdownLabel: {
    fontSize: 10,
    color: Colors.textSecondary,
    marginTop: 1,
  },

  emptyCard: {
    borderWidth: 1.4,
    borderColor: Colors.border,
    borderRadius: 16,
    backgroundColor: Colors.surface,
    paddingVertical: 24,
    alignItems: 'center',
  },
  emptyCardText: {
    fontSize: 13,
    color: Colors.textSecondary,
  },

  payoutHistoryLink: {
    width: SW - 48,
    alignItems: 'center',
    paddingVertical: 10,
    marginBottom: 8,
  },
  payoutHistoryLinkText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.brandGreen,
  },

  sectionDivider: {
    width: SW - 48,
    height: 1,
    backgroundColor: Colors.border,
    marginTop: 8,
    marginBottom: 18,
  },
  sectionTitle: {
    fontSize: 15.5,
    fontWeight: '800',
    color: Colors.brandGreen,
    alignSelf: 'flex-start',
    marginLeft: 24,
    marginBottom: 14,
  },

  balanceCard: {
    width: SW - 48,
    alignItems: 'center',
    borderWidth: 1.4,
    borderColor: Colors.border,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    paddingVertical: 26,
    paddingHorizontal: 20,
    marginBottom: 18,
  },
  balanceValue: {
    fontSize: 30,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginTop: 8,
  },
  balanceLabel: {
    fontSize: 11.5,
    color: Colors.textSecondary,
    marginTop: 2,
    marginBottom: 18,
    textAlign: 'center',
  },
  progressTrack: {
    width: '100%',
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.border,
    overflow: 'hidden',
    marginBottom: 10,
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.cod,
  },
  progressLabel: {
    fontSize: 11.5,
    color: Colors.textSecondary,
    textAlign: 'center',
  },

  remitBtn: {
    width: SW - 48,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 16,
    paddingVertical: 16,
  },
  remitBtnText: {
    fontSize: 15.5,
    fontWeight: '700',
    color: Colors.white,
  },

  remitPanel: {
    width: SW - 48,
  },
  remitPanelTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  methodCard: {
    borderWidth: 1.4,
    borderColor: Colors.border,
    borderRadius: 16,
    backgroundColor: Colors.surface,
    padding: 14,
    marginBottom: 10,
  },
  methodCardSelected: {
    borderColor: Colors.brandGreen,
    borderWidth: 1.8,
  },
  methodTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  methodDetail: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 17,
  },

  errorText: {
    color: Colors.error,
    fontSize: 12.5,
    marginTop: 4,
    marginBottom: 4,
  },
  disclaimer: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 8,
    marginBottom: 16,
    lineHeight: 15,
  },

  remitActionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  secondaryBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.4,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
    borderRadius: 16,
    paddingVertical: 15,
  },
  secondaryBtnText: {
    fontSize: 14.5,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  confirmBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.online,
    borderRadius: 16,
    paddingVertical: 15,
  },
  confirmBtnDisabled: {
    opacity: 0.6,
  },
  confirmBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.white,
  },
});
