import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, ImageBackground, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Colors } from '../theme/colors';
import { commonStyles, SW } from '../theme/styles';
import { AuthStackParamList } from '../navigation/types';
import BackButton from '../components/BackButton';
import { AlertCircleIcon, BellIcon, DeliveryBoxIcon, RupeeIcon, StarIcon } from '../components/Icons';
import {
  NotificationResponse,
  NotificationType,
  useGetNotificationsQuery,
  useMarkAllNotificationsReadMutation,
  useMarkNotificationReadMutation,
} from '../store/deliveryApi';

type Props = NativeStackScreenProps<AuthStackParamList, 'Notifications'>;

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: 'numeric', minute: '2-digit' });
}

const TYPE_ICON: Record<NotificationType, { Icon: typeof BellIcon; color: string }> = {
  KYC_APPROVED: { Icon: StarIcon, color: Colors.online },
  KYC_REJECTED: { Icon: AlertCircleIcon, color: Colors.error },
  NEW_ASSIGNMENT: { Icon: DeliveryBoxIcon, color: Colors.brandGreen },
  ORDER_CANCELLED: { Icon: AlertCircleIcon, color: Colors.error },
  PAYOUT_PROCESSED: { Icon: RupeeIcon, color: Colors.brandGreen },
  RATING_ALERT: { Icon: StarIcon, color: Colors.warning },
  ANNOUNCEMENT: { Icon: BellIcon, color: Colors.primary },
};

// FR-12.3 — where each notification type navigates on tap. Types with no
// natural target (ANNOUNCEMENT) just mark read in place.
function targetScreen(type: NotificationType): keyof AuthStackParamList | null {
  switch (type) {
    case 'NEW_ASSIGNMENT':
    case 'ORDER_CANCELLED':
      return 'Home';
    case 'PAYOUT_PROCESSED':
      return 'PayoutHistory';
    case 'RATING_ALERT':
      return 'RatingsFeedback';
    case 'KYC_APPROVED':
    case 'KYC_REJECTED':
      return 'Profile';
    default:
      return null;
  }
}

// M12 — Notifications (FR-12.3). Paginated tray of recent notifications;
// tapping marks it read and navigates to the relevant screen.
export default function NotificationsScreen({ navigation }: Props) {
  const [page, setPage] = useState(0);
  const [items, setItems] = useState<NotificationResponse[]>([]);
  const { data, isLoading, isFetching } = useGetNotificationsQuery(page);
  const [markRead] = useMarkNotificationReadMutation();
  const [markAllRead, { isLoading: isMarkingAll }] = useMarkAllNotificationsReadMutation();

  useEffect(() => {
    if (!data) return;
    setItems((prev) => (data.page === 0 ? data.content : [...prev, ...data.content]));
  }, [data]);

  const handleLoadMore = () => {
    if (data?.hasNext && !isFetching) setPage((p) => p + 1);
  };

  const handlePress = (item: NotificationResponse) => {
    if (!item.read) {
      markRead(item.id);
      setItems((prev) => prev.map((n) => (n.id === item.id ? { ...n, read: true } : n)));
    }
    const screen = targetScreen(item.type);
    if (screen) navigation.navigate(screen as any);
  };

  const handleMarkAllRead = async () => {
    await markAllRead();
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const hasUnread = items.some((n) => !n.read);

  return (
    <ImageBackground source={require('../../assets/images/bg-pattern.png')} style={styles.root} resizeMode="cover">
      <StatusBar style="dark" />
      <SafeAreaView style={commonStyles.safe}>
        <View style={styles.headerRow}>
          <BackButton onPress={() => navigation.goBack()} />
          {hasUnread && (
            <TouchableOpacity onPress={handleMarkAllRead} disabled={isMarkingAll}>
              <Text style={styles.markAllText}>Mark all read</Text>
            </TouchableOpacity>
          )}
        </View>
        <Text style={styles.title}>Notifications</Text>

        {isLoading ? (
          <ActivityIndicator color={Colors.primary} style={styles.loading} />
        ) : items.length === 0 ? (
          <View style={styles.emptyCard}>
            <BellIcon size={28} color={Colors.textSecondary} />
            <Text style={styles.emptyCardText}>No notifications yet.</Text>
          </View>
        ) : (
          <FlatList
            style={styles.list}
            data={items}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => <NotificationRow item={item} onPress={() => handlePress(item)} />}
            onEndReachedThreshold={0.4}
            onEndReached={handleLoadMore}
            ListFooterComponent={isFetching && page > 0 ? <ActivityIndicator color={Colors.primary} style={styles.footerLoading} /> : null}
          />
        )}
      </SafeAreaView>
    </ImageBackground>
  );
}

function NotificationRow({ item, onPress }: { item: NotificationResponse; onPress: () => void }) {
  const { Icon, color } = TYPE_ICON[item.type];
  return (
    <TouchableOpacity style={[styles.row, !item.read && styles.rowUnread]} activeOpacity={0.85} onPress={onPress}>
      <View style={[styles.iconWrap, { backgroundColor: Colors.infoBg }]}>
        <Icon size={18} color={color} />
      </View>
      <View style={styles.textWrap}>
        <Text style={styles.rowTitle}>{item.title}</Text>
        <Text style={styles.rowBody} numberOfLines={2}>{item.body}</Text>
        <Text style={styles.rowDate}>{formatDateTime(item.createdAt)}</Text>
      </View>
      {!item.read && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.cream,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingRight: 24,
  },
  markAllText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: Colors.primary,
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
    marginBottom: 16,
  },

  emptyCard: {
    alignSelf: 'center',
    width: SW - 48,
    borderWidth: 1.4,
    borderColor: Colors.border,
    borderRadius: 16,
    backgroundColor: Colors.surface,
    paddingVertical: 32,
    paddingHorizontal: 20,
    alignItems: 'center',
    gap: 10,
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
    flexDirection: 'row',
    alignItems: 'flex-start',
    width: SW - 48,
    borderWidth: 1.4,
    borderColor: Colors.border,
    borderRadius: 16,
    backgroundColor: Colors.surface,
    padding: 14,
    marginBottom: 10,
  },
  rowUnread: {
    borderColor: Colors.brandGreen,
    backgroundColor: '#F7FBF6',
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  textWrap: {
    flex: 1,
    marginRight: 8,
  },
  rowTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  rowBody: {
    fontSize: 12.5,
    color: Colors.textSecondary,
    lineHeight: 17,
    marginBottom: 6,
  },
  rowDate: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.brandGreen,
    marginTop: 4,
  },
});
