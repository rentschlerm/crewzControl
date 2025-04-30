// useLocation.tsx
import { useState } from 'react';
import { Alert } from 'react-native';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage'; 

interface LocationData {
  longitude: string;
  latitude: string;
  accuracy: string;
}

const useLocation = () => {
  const [location, setLocation] = useState<LocationData | null>(null);

  const fetchLocation = async () => {
    try {
      // Request location permissions
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permissions are required to sign in.');
        return;
      }

      // Get location
      const locationData = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
     
      // JCM 04/30/2025: Function to create location data using AsyncStorage. This is to solve the location issue when the user is first time to open the app and accepts the location permission. 
      // ================================================================ 
      await AsyncStorage.setItem('location', JSON.stringify({
        longitude: locationData.coords.longitude,
        latitude: locationData.coords.latitude,
        accuracy: locationData.coords.accuracy || 'N/A',
      }));

      // ================================================================
      setLocation({
        longitude: locationData.coords.longitude.toString(),
        latitude: locationData.coords.latitude.toString(),
        accuracy: locationData.coords.accuracy?.toString() || 'N/A',
      });
      
    } catch (error) {
      console.error('Error fetching location:', error);
      Alert.alert('Location Error', 'Failed to get location.');
    }
  };

  return { location, fetchLocation };
};

export default useLocation;
