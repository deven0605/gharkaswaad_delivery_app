import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  ImageBackground,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../theme/colors';
import { commonStyles, SW } from '../theme/styles';
import { DeliveryBoxIcon, LocationPinIcon, RupeeIcon, StarIcon } from '../components/Icons';
import PlaceholderScreen from '../components/PlaceholderScreen';
import IncomingRequestModal from '../components/IncomingRequestModal';
import ActiveAssignmentModal from '../components/ActiveAssignmentModal';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  AssignmentResponse,
  deliveryApi,
  useAcceptAssignmentMutation,
  useCancelAssignmentMutation,
  useDeclineAssignmentMutation,
  useGetCurrentAssignmentQuery,
  useGetDashboardSummaryQuery,
  useGetPartnerProfileQuery,
  useUpdateDutyStatusMutation,
} from '../store/deliveryApi';
import { extractApiErrorMessage } from '../store/authApi';
import { connectLocationSocket, disconnectLocationSocket, setAssignmentListeners } from '../services/locationSocket';
import { hasLocationTrackingStarted, requestLocationPermissions, startLocationTracking, stopLocationTracking } from '../services/locationTracking';

function formatRupees(paise: number): string {
  return `₹${Math.round(paise / 100).toLocaleString('en-IN')}`;
}

function secondsUntil(iso: string): number {
  return Math.max(0, Math.ceil((new Date(iso).getTime() - Date.now()) / 1000));
}

// S09 — Home Dashboard (M3.1/M3.2). Reached for APPROVED/SUSPENDED partners
// after OTP verification (FR-1.10).
export default function HomeScreen() {
  const dispatch = useAppDispatch();
  const lifecycleState = useAppSelector((state) => state.auth.lifecycleState);
  const accessToken = useAppSelector((state) => state.auth.accessToken);

  const { data: profile } = useGetPartnerProfileQuery();
  const { data: summary, isLoading: isSummaryLoading } = useGetDashboardSummaryQuery(undefined, {
    pollingInterval: 30000,
  });
  const { data: resumedAssignment } = useGetCurrentAssignmentQuery();
  const [updateDutyStatus, { isLoading: isUpdatingDuty }] = useUpdateDutyStatusMutation();
  const [acceptAssignment, { isLoading: isAccepting }] = useAcceptAssignmentMutation();
  const [declineAssignment] = useDeclineAssignmentMutation();
  const [cancelAssignment, { isLoading: isCancelling }] = useCancelAssignmentMutation();

  const [isTogglePending, setIsTogglePending] = useState(false);
  const [incomingAssignment, setIncomingAssignment] = useState<AssignmentResponse | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [showActiveModal, setShowActiveModal] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  const isApproved = lifecycleState === 'APPROVED';
  const isOnline = summary?.dutyStatus === 'ONLINE';
  const isOnDelivery = summary?.dutyStatus === 'ON_DELIVERY';

  // FR-4.1/FR-4.7 — one-time listener registration; the socket module reads
  // these on every push, so registering before connect/reconnect is enough.
  useEffect(() => {
    setAssignmentListeners({
      onOffer: (payload) => setIncomingAssignment(payload as AssignmentResponse),
      onCancellation: () => {
        Alert.alert('Order Cancelled', 'The kitchen or customer cancelled this order. You are back online.');
        dispatch(deliveryApi.util.invalidateTags(['DashboardSummary', 'CurrentAssignment']));
      },
    });
    return () => setAssignmentListeners({});
  }, [dispatch]);

  // M4.1 — resume an offer that was still pending when the app was last closed.
  useEffect(() => {
    if (resumedAssignment && resumedAssignment.status === 'OFFERED') {
      setIncomingAssignment(resumedAssignment);
    }
  }, [resumedAssignment]);

  // FR-4.3 — countdown that auto-declines when it reaches zero.
  useEffect(() => {
    if (!incomingAssignment) return;
    setSecondsLeft(secondsUntil(incomingAssignment.expiresAt));

    const interval = setInterval(() => {
      const remaining = secondsUntil(incomingAssignment.expiresAt);
      setSecondsLeft(remaining);
      if (remaining <= 0) {
        clearInterval(interval);
        declineAssignment({ assignmentId: incomingAssignment.id }).finally(() => setIncomingAssignment(null));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [incomingAssignment, declineAssignment]);

  // Reconcile with a background location task that may already be running
  // from before the app was last closed (native-side state survives JS reloads).
  useEffect(() => {
    if (!profile || !accessToken || !summary) return;
    if (summary.dutyStatus !== 'OFFLINE') {
      connectLocationSocket(profile.id, accessToken);
      hasLocationTrackingStarted().then((started) => {
        if (!started) startLocationTracking();
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.id, accessToken, summary?.dutyStatus]);

  const handleToggle = async (nextOnline: boolean) => {
    if (isUpdatingDuty || isTogglePending) return;

    if (nextOnline) {
      setIsTogglePending(true);
      try {
        const granted = await requestLocationPermissions();
        if (!granted) {
          Alert.alert(
            'Location permission needed',
            "ThaliCloud Partner needs background location access to go online and receive nearby orders."
          );
          return;
        }
        await updateDutyStatus({ status: 'ONLINE' }).unwrap();
        if (profile && accessToken) {
          connectLocationSocket(profile.id, accessToken);
          await startLocationTracking();
        }
      } catch (err) {
        Alert.alert('Could not go online', extractApiErrorMessage(err, 'Please try again.'));
      } finally {
        setIsTogglePending(false);
      }
    } else {
      setIsTogglePending(true);
      try {
        // FR-3.4 — the backend rejects this while ON_DELIVERY.
        await updateDutyStatus({ status: 'OFFLINE' }).unwrap();
        await stopLocationTracking();
        disconnectLocationSocket();
      } catch (err) {
        Alert.alert('Still on a delivery', extractApiErrorMessage(err, "You can't go offline right now."));
      } finally {
        setIsTogglePending(false);
      }
    }
  };

  // FR-4.4
  const handleAcceptRequest = async () => {
    if (!incomingAssignment) return;
    try {
      await acceptAssignment({ assignmentId: incomingAssignment.id }).unwrap();
      setIncomingAssignment(null);
    } catch (err) {
      Alert.alert('Could not accept', extractApiErrorMessage(err, 'This request may have expired. Please try again.'));
      setIncomingAssignment(null);
    }
  };

  // FR-4.4/FR-4.5
  const handleRejectRequest = async () => {
    if (!incomingAssignment) return;
    const id = incomingAssignment.id;
    setIncomingAssignment(null);
    try {
      await declineAssignment({ assignmentId: id }).unwrap();
    } catch {
      // Best-effort — the offer is gone from the UI either way.
    }
  };

  const handleActiveDeliveryPress = () => {
    setCancelError(null);
    setShowActiveModal(true);
  };

  // FR-4.8
  const handleConfirmCancel = async (reason: string) => {
    if (!summary?.activeDelivery) return;
    setCancelError(null);
    try {
      await cancelAssignment({ assignmentId: summary.activeDelivery.assignmentId, reason }).unwrap();
      setShowActiveModal(false);
    } catch (err) {
      setCancelError(extractApiErrorMessage(err, 'Could not cancel this delivery. Please try again.'));
    }
  };

  if (lifecycleState === 'SUSPENDED') {
    return (
      <PlaceholderScreen
        emoji="⛔"
        title="Account Suspended"
        subtitle="Your account has been suspended. Contact support for more details."
      />
    );
  }

  return (
    <ImageBackground
      source={require('../../assets/images/bg-pattern.png')}
      style={styles.root}
      resizeMode="cover"
    >
      <StatusBar style="dark" />
      <SafeAreaView style={commonStyles.safe}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <View>
              <Text style={styles.greeting}>{profile?.name ? `Hi, ${profile.name.split(' ')[0]}` : 'Welcome'}</Text>
              <View style={styles.statusPillRow}>
                <View style={[styles.statusDot, isOnDelivery ? styles.dotOnDelivery : isOnline ? styles.dotOnline : styles.dotOffline]} />
                <Text style={styles.statusText}>
                  {isOnDelivery ? 'On Delivery' : isOnline ? 'Online' : 'Offline'}
                </Text>
              </View>
            </View>

            <View style={styles.toggleWrap}>
              <Switch
                value={isOnline || isOnDelivery}
                onValueChange={handleToggle}
                disabled={!isApproved || isUpdatingDuty || isTogglePending || isOnDelivery}
                trackColor={{ false: Colors.border, true: Colors.online }}
                thumbColor={Colors.white}
              />
              {!isApproved && <Text style={styles.toggleHint}>Approval required</Text>}
            </View>
          </View>

          <View style={styles.statsRow}>
            <StatTile icon={<DeliveryBoxIcon size={18} color={Colors.brandGreen} />} label="Today's Deliveries" value={isSummaryLoading ? '—' : String(summary?.todayDeliveries ?? 0)} />
            <StatTile icon={<RupeeIcon size={18} color={Colors.brandGreen} />} label="Today's Earnings" value={isSummaryLoading ? '—' : formatRupees(summary?.todayEarningsPaise ?? 0)} />
            <StatTile icon={<StarIcon size={16} />} label="Rating" value={summary?.rating != null ? summary.rating.toFixed(1) : '—'} />
          </View>

          {summary?.activeDelivery ? (
            <TouchableOpacity style={styles.activeCard} activeOpacity={0.85} onPress={handleActiveDeliveryPress}>
              <View style={styles.activeIconWrap}>
                <DeliveryBoxIcon size={22} color={Colors.white} />
              </View>
              <View style={styles.activeTextWrap}>
                <Text style={styles.activeTitle}>Active Delivery</Text>
                <Text style={styles.activeSubtitle}>
                  {summary.activeDelivery.kitchenName} → {summary.activeDelivery.dropLocality}
                </Text>
              </View>
            </TouchableOpacity>
          ) : isOnline ? (
            <IdlePulsePanel />
          ) : (
            <View style={styles.offlineCard}>
              <Text style={styles.offlineCardText}>
                {isApproved ? "Go online to start receiving orders." : 'Your account needs to be approved before you can go online.'}
              </Text>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>

      {incomingAssignment && (
        <IncomingRequestModal
          assignment={incomingAssignment}
          secondsLeft={secondsLeft}
          totalSeconds={Math.max(1, Math.round((new Date(incomingAssignment.expiresAt).getTime() - new Date(incomingAssignment.offeredAt).getTime()) / 1000))}
          isResponding={isAccepting}
          onAccept={handleAcceptRequest}
          onReject={handleRejectRequest}
        />
      )}

      {showActiveModal && summary?.activeDelivery && (
        <ActiveAssignmentModal
          activeDelivery={summary.activeDelivery}
          isCancelling={isCancelling}
          cancelError={cancelError}
          onClose={() => setShowActiveModal(false)}
          onConfirmCancel={handleConfirmCancel}
        />
      )}
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

// FR-3.7 — "Looking for orders near you", a subtle pulse in place of a live
// map (react-native-maps needs a provisioned Google Maps API key this
// environment doesn't have; a lightweight animation satisfies the same
// "still online, no map needed" affordance without that dependency).
function IdlePulsePanel() {
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(pulse, { toValue: 1, duration: 1800, useNativeDriver: true })
    );
    loop.start();
    return () => {
      loop.stop();
      pulse.setValue(0);
    };
  }, [pulse]);

  const ringStyle = (delay: number) => ({
    opacity: pulse.interpolate({ inputRange: [0, delay, 1], outputRange: [0.5, 0.5, 0], extrapolate: 'clamp' as const }),
    transform: [
      {
        scale: pulse.interpolate({ inputRange: [0, delay, 1], outputRange: [0.4, 0.4, 1.6], extrapolate: 'clamp' as const }),
      },
    ],
  });

  return (
    <View style={styles.idlePanel}>
      <View style={styles.pulseStage}>
        <Animated.View style={[styles.pulseRing, ringStyle(0)]} />
        <Animated.View style={[styles.pulseRing, ringStyle(0.35)]} />
        <View style={styles.pulseCore}>
          <LocationPinIcon size={22} color={Colors.white} />
        </View>
      </View>
      <Text style={styles.idleTitle}>Looking for orders near you</Text>
      <Text style={styles.idleSubtitle}>We'll notify you the moment a delivery comes in.</Text>
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

  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    width: SW - 48,
    marginBottom: 20,
  },
  greeting: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.brandGreen,
    marginBottom: 6,
  },
  statusPillRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    marginRight: 6,
  },
  dotOnline: {
    backgroundColor: Colors.online,
  },
  dotOffline: {
    backgroundColor: Colors.offline,
  },
  dotOnDelivery: {
    backgroundColor: Colors.onDelivery,
  },
  statusText: {
    fontSize: 13.5,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  toggleWrap: {
    alignItems: 'flex-end',
  },
  toggleHint: {
    fontSize: 10.5,
    color: Colors.textSecondary,
    marginTop: 4,
    maxWidth: 90,
    textAlign: 'right',
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
    paddingHorizontal: 6,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginTop: 6,
  },
  statLabel: {
    fontSize: 10.5,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 2,
  },

  activeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    width: SW - 48,
    backgroundColor: Colors.onDelivery,
    borderRadius: 18,
    padding: 16,
  },
  activeIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  activeTextWrap: {
    flex: 1,
  },
  activeTitle: {
    fontSize: 15.5,
    fontWeight: '800',
    color: Colors.white,
  },
  activeSubtitle: {
    fontSize: 12.5,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 2,
  },

  offlineCard: {
    width: SW - 48,
    borderWidth: 1.4,
    borderColor: Colors.border,
    borderRadius: 18,
    backgroundColor: Colors.surface,
    padding: 20,
    alignItems: 'center',
  },
  offlineCardText: {
    fontSize: 13.5,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 19,
  },

  idlePanel: {
    width: SW - 48,
    borderWidth: 1.4,
    borderColor: Colors.border,
    borderRadius: 18,
    backgroundColor: Colors.surface,
    paddingVertical: 28,
    alignItems: 'center',
  },
  pulseStage: {
    width: 90,
    height: 90,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  pulseRing: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: Colors.online,
  },
  pulseCore: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.online,
    alignItems: 'center',
    justifyContent: 'center',
  },
  idleTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  idleSubtitle: {
    fontSize: 12.5,
    color: Colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 24,
  },
});
