// useLocation.tsx
import { useState } from 'react';
import { Alert } from 'react-native';
import * as Location from 'expo-location';

interface LocationData {
  longitude: string;
  latitude: string;
  accuracy: string;
}

const useLocation = (accuracy: Location.Accuracy = Location.Accuracy.Lowest) => {
  const [location, setLocation] = useState<LocationData | null>(null);

  const fetchLocation = async (): Promise<void> => {
    try {
      // Request location permissions
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.error('Permission Denied', 'Location permissions are required to sign in.');
        return;
      }

      // Get location
      const locationData = await Location.getCurrentPositionAsync({
        accuracy: accuracy,
      });
     
      setLocation({
        longitude: locationData.coords.longitude.toString(),
        latitude: locationData.coords.latitude.toString(),
        accuracy: locationData.coords.accuracy?.toString() || 'N/A',
      });
    } catch (error) {
      console.error('Error fetching location:', error);
    }
  };

  return { location, fetchLocation };
};

export default useLocation;
