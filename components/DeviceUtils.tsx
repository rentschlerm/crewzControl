import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Function to fetch device information
export const getDeviceInfo = async () => {
  return {
    id: Constants.sessionId || 'UnknownDeviceID', // Use session ID or fallback
    type: Platform.OS === 'ios' ? 'iOS' : 'Android', // Determine platform type
    version: Platform.Version.toString() || 'UnknownVersion', // Get the OS version
  };
};
