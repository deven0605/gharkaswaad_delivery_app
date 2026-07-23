import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, ImageBackground, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Colors } from '../theme/colors';
import { commonStyles, SW } from '../theme/styles';
import { AuthStackParamList } from '../navigation/types';
import { DeliveryBoxIcon, IdCardIcon, LocationPinIcon, NavigationArrowIcon, PhoneCallIcon, RupeeIcon } from '../components/Icons';
import SosButton from '../components/SosButton';
import { useArriveAtKitchenMutation, useGetCurrentAssignmentQuery } from '../store/deliveryApi';
import { extractApiErrorMessage } from '../store/authApi';
import { openNavigation, callNumber } from '../services/mapsLink';
import { haversineMeters } from '../services/geo';

type Props = NativeStackScreenProps<AuthStackParamList, 'PickupNavigation'>;

const GEOFENCE_METERS = 200;
const MANUAL_FALLBACK_SECONDS = 45;

function formatRupees(paise: number): string {
  return `₹${Math.round(paise / 100).toLocaleString('en-IN')}`;
}

// S12 — Navigate to Kitchen (M5/FR-5.1-5.4). No react-native-maps/API-key
// dependency exists in this project (see HomeScreen's IdlePulsePanel comment
// for the same constraint) — this uses a stylized route card instead of a
// real map, while "Navigate" still deep-links to the real Google/Apple Maps
// app for actual turn-by-turn directions (FR-5.2).
export default function PickupNavigationScreen({ navigation }: Props) {
  const { data: assignment } = useGetCurrentAssignmentQuery(undefined, { pollingInterval: 10000 });
  const [arriveAtKitchen, { isLoading: isArriving }] = useArriveAtKitchenMutation();

  const [distanceMeters, setDistanceMeters] = useState<number | null>(null);
  const [fallbackReady, setFallbackReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastFix = useRef<{ latitude: number; longitude: number } | null>(null);

  // Redirects that keep this screen in sync with the assignment's real
  // status (e.g. resumed mid-flow, or cancelled by the kitchen/customer
  // while this screen is open — HomeScreen's STOMP listener invalidates the
  // CurrentAssignment tag, which lands here on the next poll/refetch).
  useEffect(() => {
    if (assignment === null) {
      navigation.replace('Home');
    } else if (assignment && assignment.status === 'ARRIVED_AT_KITCHEN') {
      navigation.replace('PickupVerification');
    } else if (assignment && assignment.status !== 'ACCEPTED') {
      navigation.replace('Home');
    }
  }, [assignment, navigation]);

  // FR-5.4 — live geofence distance, foreground-only (independent of the
  // background location task, which only publishes over the socket).
  useEffect(() => {
    if (!assignment) return;
    let subscription: Location.LocationSubscription | undefined;

    Location.watchPositionAsync(
      { accuracy: Location.Accuracy.High, timeInterval: 4000, distanceInterval: 10 },
      (loc) => {
        lastFix.current = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
        setDistanceMeters(
          haversineMeters(loc.coords.latitude, loc.coords.longitude, assignment.kitchenLatitude, assignment.kitchenLongitude)
        );
      }
    ).then((sub) => {
      subscription = sub;
    });

    return () => subscription?.remove();
  }, [assignment]);

  useEffect(() => {
    const timer = setTimeout(() => setFallbackReady(true), MANUAL_FALLBACK_SECONDS * 1000);
    return () => clearTimeout(timer);
  }, []);

  if (!assignment) {
    return (
      <View style={styles.loadingRoot}>
        <ActivityIndicator color={Colors.primary} size="large" />
      </View>
    );
  }

  const withinGeofence = distanceMeters !== null && distanceMeters <= GEOFENCE_METERS;
  const canMarkArrived = withinGeofence || fallbackReady;

  const handleNavigate = () => {
    openNavigation(assignment.kitchenLatitude, assignment.kitchenLongitude);
  };

  const handleCallKitchen = () => {
    callNumber(assignment.kitchenContactNumber);
  };

  const handleArrived = async () => {
    setError(null);
    try {
      await arriveAtKitchen({
        assignmentId: assignment.id,
        latitude: lastFix.current?.latitude,
        longitude: lastFix.current?.longitude,
      }).unwrap();
      navigation.replace('PickupVerification');
    } catch (err) {
      setError(extractApiErrorMessage(err, 'Could not record arrival. Please try again.'));
    }
  };

  return (
    <ImageBackground source={require('../../assets/images/bg-pattern.png')} style={styles.root} resizeMode="cover">
      <StatusBar style="dark" />
      <SafeAreaView style={commonStyles.safe}>
        <SosButton />
        <View style={styles.header}>
          <Text style={styles.headerLabel}>Heading to pickup</Text>
          <Text style={styles.headerTitle}>{assignment.kitchenName}</Text>
        </View>

        <View style={styles.routeCard}>
          <View style={styles.routeStage}>
            <View style={styles.routeNodeRow}>
              <View style={[styles.routeDot, styles.routeDotSelf]} />
              <Text style={styles.routeNodeLabel}>You</Text>
            </View>
            <View style={styles.routeLine} />
            <View style={styles.routeNodeRow}>
              <View style={styles.routeDotKitchen}>
                <LocationPinIcon size={16} color={Colors.white} />
              </View>
              <Text style={styles.routeNodeLabel}>{assignment.kitchenName}</Text>
            </View>
          </View>

          <Text style={styles.distanceReadout}>
            {distanceMeters !== null
              ? distanceMeters >= 1000
                ? `${(distanceMeters / 1000).toFixed(1)} km away`
                : `${Math.round(distanceMeters)} m away`
              : `~${assignment.kitchenDistanceKm.toFixed(1)} km away`}
          </Text>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statBlock}>
            <RupeeIcon size={16} color={Colors.brandGreen} />
            <Text style={styles.statValue}>{formatRupees(assignment.estimatedPayoutPaise)}</Text>
            <Text style={styles.statLabel}>Est. Payout</Text>
          </View>
          <View style={styles.statBlock}>
            <DeliveryBoxIcon size={16} color={Colors.brandGreen} />
            <Text style={styles.statValue}>{assignment.itemCount}</Text>
            <Text style={styles.statLabel}>Items</Text>
          </View>
          <View style={styles.statBlock}>
            <IdCardIcon size={16} color={Colors.brandGreen} />
            <Text style={styles.statValue}>#{assignment.orderId}</Text>
            <Text style={styles.statLabel}>Order</Text>
          </View>
        </View>

        <View style={commonStyles.spacer} />

        {error && <Text style={styles.errorText}>{error}</Text>}

        <View style={styles.actionRow}>
          <TouchableOpacity style={[styles.actionBtn, styles.navigateBtn]} activeOpacity={0.85} onPress={handleNavigate}>
            <NavigationArrowIcon size={18} color={Colors.white} />
            <Text style={styles.navigateBtnText}>Navigate</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, styles.callBtn]} activeOpacity={0.85} onPress={handleCallKitchen}>
            <PhoneCallIcon size={16} color={Colors.white} />
            <Text style={styles.callBtnText}>Call Kitchen</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.arrivedBtn, !canMarkArrived && styles.arrivedBtnDisabled]}
          activeOpacity={0.85}
          disabled={!canMarkArrived || isArriving}
          onPress={handleArrived}
        >
          {isArriving ? (
            <ActivityIndicator color={Colors.white} />
          ) : (
            <Text style={styles.arrivedBtnText}>Arrived at Kitchen</Text>
          )}
        </TouchableOpacity>
        <Text style={styles.arrivedHint}>
          {canMarkArrived
            ? "You're close enough to confirm arrival."
            : `Get within ${GEOFENCE_METERS}m of the kitchen, or wait a moment to continue manually.`}
        </Text>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.cream,
  },
  loadingRoot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.cream,
  },

  header: {
    width: SW - 48,
    alignSelf: 'center',
    marginTop: 8,
    marginBottom: 18,
  },
  headerLabel: {
    fontSize: 12.5,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  headerTitle: {
    fontSize: 21,
    fontWeight: '800',
    color: Colors.brandGreen,
  },

  routeCard: {
    width: SW - 48,
    alignSelf: 'center',
    borderWidth: 1.4,
    borderColor: Colors.border,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    paddingVertical: 24,
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  routeStage: {
    marginBottom: 14,
  },
  routeNodeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  routeDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    marginRight: 12,
  },
  routeDotSelf: {
    backgroundColor: Colors.onDelivery,
  },
  routeDotKitchen: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  routeNodeLabel: {
    fontSize: 14.5,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  routeLine: {
    width: 2,
    height: 28,
    marginLeft: 6,
    marginVertical: 4,
    backgroundColor: Colors.border,
  },
  distanceReadout: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
    textAlign: 'center',
  },

  statsRow: {
    flexDirection: 'row',
    width: SW - 48,
    alignSelf: 'center',
    gap: 10,
  },
  statBlock: {
    flex: 1,
    alignItems: 'center',
    borderWidth: 1.4,
    borderColor: Colors.border,
    borderRadius: 14,
    backgroundColor: Colors.surface,
    paddingVertical: 12,
  },
  statValue: {
    fontSize: 13.5,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginTop: 4,
  },
  statLabel: {
    fontSize: 10,
    color: Colors.textSecondary,
    marginTop: 1,
  },

  errorText: {
    color: Colors.error,
    fontSize: 12.5,
    textAlign: 'center',
    marginBottom: 8,
    marginHorizontal: 24,
  },

  actionRow: {
    flexDirection: 'row',
    width: SW - 48,
    alignSelf: 'center',
    gap: 12,
    marginBottom: 14,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 16,
    paddingVertical: 15,
  },
  navigateBtn: {
    backgroundColor: Colors.primary,
  },
  navigateBtnText: {
    fontSize: 14.5,
    fontWeight: '700',
    color: Colors.white,
  },
  callBtn: {
    backgroundColor: Colors.brandGreen,
  },
  callBtnText: {
    fontSize: 14.5,
    fontWeight: '700',
    color: Colors.white,
  },

  arrivedBtn: {
    width: SW - 48,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.online,
    borderRadius: 16,
    paddingVertical: 16,
  },
  arrivedBtnDisabled: {
    backgroundColor: Colors.border,
  },
  arrivedBtnText: {
    fontSize: 15.5,
    fontWeight: '700',
    color: Colors.white,
  },
  arrivedHint: {
    fontSize: 11.5,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 20,
    marginHorizontal: 32,
  },
});
