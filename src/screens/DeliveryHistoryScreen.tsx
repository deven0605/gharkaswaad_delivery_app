import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, ImageBackground, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Colors } from '../theme/colors';
import { commonStyles, SW } from '../theme/styles';
import { AuthStackParamList } from '../navigation/types';
import BackButton from '../components/BackButton';
import { LocationPinIcon } from '../components/Icons';
import { DeliveryHistoryItemResponse, DeliveryHistoryStatus, useGetDeliveryHistoryQuery } from '../store/deliveryApi';

type Props = NativeStackScreenProps<AuthStackParamList, 'DeliveryHistory'>;

function formatRupees(paise: number): string {
  return `₹${Math.round(paise / 100).toLocaleString('en-IN')}`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

const STATUS_STYLE: Record<DeliveryHistoryStatus, { bg: string; text: string; label: string }> = {
  DELIVERED: { bg: '#DCFCE7', text: Colors.online, label: 'Completed' },
  CANCELLED_BY_PARTNER: { bg: '#FEE2E2', text: Colors.error, label: 'Cancelled' },
  CANCELLED_BY_CUSTOMER: { bg: '#FEE2E2', text: Colors.error, label: 'Cancelled' },
  CANCELLED_BY_KITCHEN: { bg: '#FEE2E2', text: Colors.error, label: 'Cancelled' },
};

// M9 — Delivery History (FR-9.1/FR-9.3). Lists all completed/cancelled
// deliveries, paginated 20 per page; tapping a row opens the full detail
// (FR-9.2, DeliveryHistoryDetailScreen).
export default function DeliveryHistoryScreen({ navigation }: Props) {
  const [page, setPage] = useState(0);
  const [items, setItems] = useState<DeliveryHistoryItemResponse[]>([]);
  const { data, isLoading, isFetching } = useGetDeliveryHistoryQuery(page);

  useEffect(() => {
    if (!data) return;
    setItems((prev) => (data.page === 0 ? data.content : [...prev, ...data.content]));
  }, [data]);

  const handleLoadMore = () => {
    if (data?.hasNext && !isFetching) setPage((p) => p + 1);
  };

  return (
    <ImageBackground source={require('../../assets/images/bg-pattern.png')} style={styles.root} resizeMode="cover">
      <StatusBar style="dark" />
      <SafeAreaView style={commonStyles.safe}>
        <BackButton onPress={() => navigation.goBack()} />
        <Text style={styles.title}>Delivery History</Text>
        <Text style={styles.subtitle}>All your completed and cancelled deliveries.</Text>

        {isLoading ? (
          <ActivityIndicator color={Colors.primary} style={styles.loading} />
        ) : items.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyCardText}>No past deliveries yet. Completed and cancelled deliveries will appear here.</Text>
          </View>
        ) : (
          <FlatList
            style={styles.list}
            data={items}
            keyExtractor={(item) => item.assignmentId}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <HistoryRow item={item} onPress={() => navigation.navigate('DeliveryHistoryDetail', { assignmentId: item.assignmentId })} />
            )}
            onEndReachedThreshold={0.4}
            onEndReached={handleLoadMore}
            ListFooterComponent={isFetching && page > 0 ? <ActivityIndicator color={Colors.primary} style={styles.footerLoading} /> : null}
          />
        )}
      </SafeAreaView>
    </ImageBackground>
  );
}

function HistoryRow({ item, onPress }: { item: DeliveryHistoryItemResponse; onPress: () => void }) {
  const badge = STATUS_STYLE[item.status];
  return (
    <TouchableOpacity style={styles.row} activeOpacity={0.85} onPress={onPress}>
      <View style={styles.rowHeader}>
        <View style={styles.routeWrap}>
          <LocationPinIcon size={14} color={Colors.textSecondary} />
          <Text style={styles.route} numberOfLines={1}>
            {item.kitchenName} → {item.dropLocality}
          </Text>
        </View>
        <View style={[styles.badge, { backgroundColor: badge.bg }]}>
          <Text style={[styles.badgeText, { color: badge.text }]}>{badge.label}</Text>
        </View>
      </View>
      <View style={styles.rowFooter}>
        <Text style={styles.rowDate}>Order #{item.orderId} · {formatDate(item.completedAt)}</Text>
        <Text style={styles.rowPayout}>{item.status === 'DELIVERED' ? formatRupees(item.payoutPaise) : '—'}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.cream,
  },
  loading: {
    marginTop: 40,
  },
  footerLoading: {
    marginVertical: 16,
  },

  title: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.brandGreen,
    marginLeft: 24,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12.5,
    color: Colors.textSecondary,
    marginLeft: 24,
    marginRight: 24,
    marginBottom: 18,
    lineHeight: 18,
  },

  emptyCard: {
    alignSelf: 'center',
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

  list: {
    flex: 1,
  },
  listContent: {
    alignItems: 'center',
    paddingBottom: 32,
  },
  row: {
    width: SW - 48,
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
    marginBottom: 8,
  },
  routeWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    marginRight: 8,
  },
  route: {
    fontSize: 13.5,
    fontWeight: '700',
    color: Colors.textPrimary,
    flexShrink: 1,
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
  rowFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rowDate: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  rowPayout: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
});
