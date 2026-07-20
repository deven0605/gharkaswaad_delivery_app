import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { publishLocation } from './locationSocket';

const LOCATION_TASK_NAME = 'partner-location-task';

// FR-3.3 — must be defined at module scope (not inside a component) so
// expo-task-manager can invoke it even while the app is backgrounded.
// FR-3.5 — the `foregroundService` option passed to startLocationUpdatesAsync
// below is what gives Android its persistent "still tracking" notification;
// no separate expo-notifications wiring needed.
TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }) => {
  if (error) return;
  const locations = (data as { locations?: Location.LocationObject[] } | undefined)?.locations;
  const latest = locations?.[locations.length - 1];
  if (latest) {
    publishLocation(latest.coords.latitude, latest.coords.longitude);
  }
});

/** FR-3.2 — foreground, then background, permission. Either being denied means "not granted". */
export async function requestLocationPermissions(): Promise<boolean> {
  const foreground = await Location.requestForegroundPermissionsAsync();
  if (foreground.status !== 'granted') return false;

  const background = await Location.requestBackgroundPermissionsAsync();
  return background.status === 'granted';
}

export async function hasLocationTrackingStarted(): Promise<boolean> {
  return Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME);
}

/** FR-3.3/FR-3.5 — publishes a GPS fix every ~7s with a persistent Android foreground-service notification. */
export async function startLocationTracking(): Promise<void> {
  if (await hasLocationTrackingStarted()) return;
  await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
    accuracy: Location.Accuracy.High,
    timeInterval: 7000,
    distanceInterval: 0,
    showsBackgroundLocationIndicator: true,
    foregroundService: {
      notificationTitle: "You're online",
      notificationBody: 'Tracking your location to match you with nearby orders.',
      notificationColor: '#F97316',
    },
  });
}

export async function stopLocationTracking(): Promise<void> {
  if (await hasLocationTrackingStarted()) {
    await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
  }
}
