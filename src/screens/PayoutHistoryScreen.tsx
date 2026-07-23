import React from 'react';
import { ActivityIndicator, ImageBackground, ScrollView, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Colors } from '../theme/colors';
import { commonStyles, SW } from '../theme/styles';
import { AuthStackParamList } from '../navigation/types';
import BackButton from '../components/BackButton';
import { PayoutResponse, PayoutStatus, useGetPayoutHistoryQuery } from '../store/deliveryApi';

type Props = NativeStackScreenProps<AuthStackParamList, 'PayoutHistory'>;

function formatRupees(paise: number): string {
  return `₹${Math.round(paise / 100).toLocaleString('en-IN')}`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

const STATUS_STYLE: Record<PayoutStatus, { bg: string; text: string; label: string }> = {
  PROCESSING: { bg: '#FEF3C7', text: Colors.warning, label: 'Processing' },
  PAID: { bg: '#DCFCE7', text: Colors.online, label: 'Paid' },
  FAILED: { bg: '#FEE2E2', text: Colors.error, label: 'Failed' },
};

// S18 — Payout History (M8.2/FR-8.4). Read-only: payouts are a weekly Ops
// batch in Phase 1 (FR-8.5) — there's no "request payout" action here.
export default function PayoutHistoryScreen({ navigation }: Props) {
  const { data: payouts, isLoading } = useGetPayoutHistoryQuery();

  return (
    <ImageBackground source={require('../../assets/images/bg-pattern.png')} style={styles.root} resizeMode="cover">
      <StatusBar style="dark" />
      <SafeAreaView style={commonStyles.safe}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <BackButton onPress={() => navigation.goBack()} />
          <Text style={styles.title}>Payout History</Text>
          <Text style={styles.subtitle}>Payouts are processed weekly by ThaliCloud Ops. There's no instant payout option yet.</Text>

          {isLoading ? (
            <ActivityIndicator color={Colors.primary} style={styles.loading} />
          ) : !payouts || payouts.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyCardText}>No payouts yet. Your first weekly payout will appear here once processed.</Text>
            </View>
          ) : (
            <View style={styles.listWrap}>
              {payouts.map((payout) => (
                <PayoutRow key={payout.id} payout={payout} />
              ))}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </ImageBackground>
  );
}

function PayoutRow({ payout }: { payout: PayoutResponse }) {
  const badge = STATUS_STYLE[payout.status];
  return (
    <View style={styles.row}>
      <View style={styles.rowHeader}>
        <Text style={styles.rowAmount}>{formatRupees(payout.amountPaise)}</Text>
        <View style={[styles.badge, { backgroundColor: badge.bg }]}>
          <Text style={[styles.badgeText, { color: badge.text }]}>{badge.label}</Text>
        </View>
      </View>
      <Text style={styles.rowMeta}>
        {formatDate(payout.periodStart)} - {formatDate(payout.periodEnd)}
      </Text>
      <Text style={styles.rowReference}>{payout.destinationReference}</Text>
      <Text style={styles.rowDate}>
        Initiated {formatDate(payout.initiatedAt)}
        {payout.paidAt ? ` · Paid ${formatDate(payout.paidAt)}` : ''}
      </Text>
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
    marginTop: 40,
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

  emptyCard: {
    width: SW - 48,
    borderWidth: 1.4,
    borderColor: Colors.border,
    borderRadius: 16,
    backgroundColor: Colors.surface,
    paddingVertical: 28,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  emptyCardText: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 19,
  },

  listWrap: {
    width: SW - 48,
  },
  row: {
    borderWidth: 1.4,
    borderColor: Colors.border,
    borderRadius: 16,
    backgroundColor: Colors.surface,
    padding: 16,
    marginBottom: 10,
  },
  rowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  rowAmount: {
    fontSize: 18,
    fontWeight: '800',
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
  rowMeta: {
    fontSize: 12.5,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  rowReference: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 6,
  },
  rowDate: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
});
