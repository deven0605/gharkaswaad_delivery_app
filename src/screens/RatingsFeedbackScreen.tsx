import React from 'react';
import { ActivityIndicator, ImageBackground, ScrollView, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Colors } from '../theme/colors';
import { commonStyles, SW } from '../theme/styles';
import { AuthStackParamList } from '../navigation/types';
import BackButton from '../components/BackButton';
import { AlertCircleIcon, LocationPinIcon, StarIcon } from '../components/Icons';
import { DeliveryFeedbackResponse, useGetDashboardSummaryQuery, useGetRecentFeedbackQuery } from '../store/deliveryApi';

type Props = NativeStackScreenProps<AuthStackParamList, 'RatingsFeedback'>;

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function StarRow({ rating, size = 16 }: { rating: number; size?: number }) {
  return (
    <View style={styles.starRow}>
      {[1, 2, 3, 4, 5].map((n) => (
        <StarIcon key={n} size={size} color={n <= Math.round(rating) ? Colors.warning : Colors.border} />
      ))}
    </View>
  );
}

// M10 — Ratings & Feedback (FR-10.1/FR-10.2/FR-10.3). Overall rolling rating
// (already visible on the Home dashboard) restated here alongside the
// low-rating advisory, plus the read-only per-delivery feedback list.
export default function RatingsFeedbackScreen({ navigation }: Props) {
  const { data: summary, isLoading: isSummaryLoading } = useGetDashboardSummaryQuery();
  const { data: feedback, isLoading: isFeedbackLoading } = useGetRecentFeedbackQuery();

  const rating = summary?.rating ?? null;

  return (
    <ImageBackground source={require('../../assets/images/bg-pattern.png')} style={styles.root} resizeMode="cover">
      <StatusBar style="dark" />
      <SafeAreaView style={commonStyles.safe}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <BackButton onPress={() => navigation.goBack()} />
          <Text style={styles.title}>Ratings & Feedback</Text>

          {isSummaryLoading ? (
            <ActivityIndicator color={Colors.primary} style={styles.loading} />
          ) : (
            <>
              {/* FR-10.1 — overall rolling average rating. */}
              <View style={styles.ratingCard}>
                <Text style={styles.ratingValue}>{rating != null ? rating.toFixed(1) : '—'}</Text>
                <StarRow rating={rating ?? 0} size={20} />
                <Text style={styles.ratingSubtitle}>Your overall rating, updated as customers rate completed deliveries.</Text>
              </View>

              {/* FR-10.3 — advisory banner, no auto-suspension in Phase 1. */}
              {summary?.lowRatingWarning && (
                <View style={styles.advisoryCard}>
                  <AlertCircleIcon size={20} color={Colors.error} />
                  <View style={styles.advisoryTextWrap}>
                    <Text style={styles.advisoryTitle}>Your rating needs attention</Text>
                    <Text style={styles.advisoryText}>
                      Your rating has dropped below the platform's advisory threshold. Focus on timely, courteous deliveries to bring it back up.
                    </Text>
                  </View>
                </View>
              )}
            </>
          )}

          <Text style={styles.sectionTitle}>Recent Feedback</Text>

          {isFeedbackLoading ? (
            <ActivityIndicator color={Colors.primary} style={styles.loading} />
          ) : !feedback || feedback.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyCardText}>No customer feedback yet. Ratings and comments will appear here once customers rate your deliveries.</Text>
            </View>
          ) : (
            <View style={styles.listWrap}>
              {feedback.map((item) => (
                <FeedbackRow key={item.assignmentId} item={item} />
              ))}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </ImageBackground>
  );
}

function FeedbackRow({ item }: { item: DeliveryFeedbackResponse }) {
  return (
    <View style={styles.row}>
      <View style={styles.rowHeader}>
        <View style={styles.routeWrap}>
          <LocationPinIcon size={14} color={Colors.textSecondary} />
          <Text style={styles.route} numberOfLines={1}>
            {item.kitchenName} → {item.dropLocality}
          </Text>
        </View>
        <StarRow rating={item.rating} />
      </View>
      <Text style={styles.rowMeta}>Order #{item.orderId} · {formatDate(item.ratedAt)}</Text>
      <Text style={styles.rowFeedback}>{item.feedback ? item.feedback : 'No comment left.'}</Text>
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
    marginTop: 16,
    marginBottom: 16,
  },

  title: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.brandGreen,
    alignSelf: 'flex-start',
    marginLeft: 24,
    marginBottom: 16,
  },

  ratingCard: {
    width: SW - 48,
    alignItems: 'center',
    borderWidth: 1.4,
    borderColor: Colors.border,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    paddingVertical: 24,
    paddingHorizontal: 20,
    marginBottom: 14,
  },
  ratingValue: {
    fontSize: 34,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 6,
  },
  ratingSubtitle: {
    fontSize: 11.5,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 16,
  },
  starRow: {
    flexDirection: 'row',
    gap: 3,
  },

  advisoryCard: {
    flexDirection: 'row',
    width: SW - 48,
    borderWidth: 1.4,
    borderColor: Colors.error,
    backgroundColor: '#FEF2F2',
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
    gap: 10,
  },
  advisoryTextWrap: {
    flex: 1,
  },
  advisoryTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.error,
    marginBottom: 3,
  },
  advisoryText: {
    fontSize: 11.5,
    color: Colors.textSecondary,
    lineHeight: 16,
  },

  sectionTitle: {
    fontSize: 15.5,
    fontWeight: '800',
    color: Colors.brandGreen,
    alignSelf: 'flex-start',
    marginLeft: 24,
    marginTop: 4,
    marginBottom: 14,
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
  routeWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    marginRight: 8,
  },
  route: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
    flexShrink: 1,
  },
  rowMeta: {
    fontSize: 11.5,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  rowFeedback: {
    fontSize: 13,
    color: Colors.textPrimary,
    lineHeight: 18,
  },
});
