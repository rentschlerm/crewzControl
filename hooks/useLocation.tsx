// useLocation.tsx
import { useCallback, useState } from 'react';
import * as Location from 'expo-location';

interface LocationData {
  longitude: string;
  latitude: string;
  accuracy: string;
}

// RHCM 9-16-2026
// Cache lives at module scope, not per-hook, so a fix taken by one screen counts as
// fresh for every other screen. Without this, each of the 7 useLocation() instances
// would hit the GPS on its own mount.
const FRESHNESS_WINDOW_MS = 5 * 60 * 1000; // 5 minutes

let cachedLocation: LocationData | null = null;
let cachedAt = 0;
let inFlight: Promise<LocationData | null> | null = null;

const isFresh = (): boolean =>
  cachedLocation !== null && Date.now() - cachedAt < FRESHNESS_WINDOW_MS;

/**
 * RHCM 9-16-2026
 * Returns the device location, taking a new GPS reading only if the last one is
 * older than 5 minutes. Safe to call immediately before any API request — callers
 * get back the coordinates rather than having to read them out of component state.
 */
const ageSeconds = (): number => Math.round((Date.now() - cachedAt) / 1000);

export const getFreshLocation = async (
  accuracy: Location.Accuracy = Location.Accuracy.Balanced
): Promise<LocationData | null> => {
  if (isFresh()) {
    console.log(
      `📍 CACHE HIT — reusing fix taken ${ageSeconds()}s ago (window is ${
        FRESHNESS_WINDOW_MS / 1000
      }s):`,
      cachedLocation
    );
    return cachedLocation;
  }

  // Collapse simultaneous callers onto a single GPS read instead of racing.
  if (inFlight) {
    console.log('📍 A GPS read is already in progress — joining it.');
    return inFlight;
  }

  console.log(
    cachedLocation === null
      ? '📍 CACHE EMPTY — taking first GPS reading...'
      : `📍 CACHE EXPIRED (${ageSeconds()}s old) — taking new GPS reading...`
  );

  inFlight = (async (): Promise<LocationData | null> => {
    const previous = cachedLocation;
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.error('Permission Denied', 'Location permissions are required.');
        return cachedLocation; // fall back to last known rather than dropping to null
      }

      const locationData = await Location.getCurrentPositionAsync({ accuracy });

      cachedLocation = {
        longitude: locationData.coords.longitude.toString(),
        latitude: locationData.coords.latitude.toString(),
        accuracy: locationData.coords.accuracy?.toString() || 'N/A',
      };
      cachedAt = Date.now();

      // RHCM 9-16-2026
      // Say explicitly whether the device actually moved. A new reading that returns
      // identical coordinates is a GPS/mock-location problem, not a caching problem —
      // the two look the same in the logs otherwise.
      const moved =
        previous === null ||
        previous.latitude !== cachedLocation.latitude ||
        previous.longitude !== cachedLocation.longitude;

      console.log(
        `📍 NEW GPS FIX — ${moved ? 'coordinates CHANGED' : 'coordinates IDENTICAL to previous fix'}:`,
        cachedLocation
      );
      return cachedLocation;
    } catch (error) {
      console.error('Error fetching location:', error);
      return cachedLocation; // keep the previous fix on a transient GPS failure
    } finally {
      inFlight = null;
    }
  })();

  return inFlight;
};

const useLocation = (accuracy: Location.Accuracy = Location.Accuracy.Balanced) => {
  // RHCM 9-16-2026: Seed from the shared cache so a newly mounted screen already has
  // coordinates instead of sitting in its "location is null" early-return state.
  const [location, setLocation] = useState<LocationData | null>(() =>
    isFresh() ? cachedLocation : null
  );

  // RHCM 9-16-2026: Now returns the coordinates. Callers must use the returned value —
  // reading `location` straight after awaiting this still sees the pre-update render's
  // value, which is what made the sign-in retry fail and require a second tap.
  const fetchLocation = useCallback(async (): Promise<LocationData | null> => {
    const data = await getFreshLocation(accuracy);
    setLocation(data);
    return data;
  }, [accuracy]);

  return { location, fetchLocation };
};

export default useLocation;
